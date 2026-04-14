from flask import Flask, jsonify, render_template, request
import sqlite3
import os
import pymongo

app = Flask(__name__)


# Define the path to your SQLite database file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
app.config["DATABASE"] = os.path.join(BASE_DIR, 'db', 'books.db')

# MongoDB connection
mongo_uri = os.environ.get("MONGO_URI")

if mongo_uri:
    client = pymongo.MongoClient(mongo_uri)
    db = client['book_database']
    reviews_collection = db['reviews']
else:
    reviews_collection = None

# db = client['book_database']  # MongoDB database
# reviews_collection = db['reviews']  # MongoDB collection for reviews

@app.route('/api/books', methods=['GET'])
def get_all_books():
    try:
        conn = sqlite3.connect(app.config["DATABASE"])
        cursor = conn.cursor()
        cursor.execute("""
        SELECT Books.book_id,
            Books.title,
            Books.publication_year,
            Books.image_url,
            Authors.name
        FROM Books
        LEFT JOIN book_author ON Books.book_id = book_author.book_id
        LEFT JOIN Authors ON book_author.author_id = Authors.author_id
        """)
        books = cursor.fetchall()
        conn.close()

        # Convert the list of tuples into a list of dictionaries
        book_list = []
        for book in books:
            book_dict = {
                'book_id': book[0],
                'title': book[1],
                'publication_year': book[2],
                'image_url': book[3],
                'author': book[4]
                # Add other attributes here as needed
            }
            book_list.append(book_dict)

        return jsonify({'books': book_list})
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/api/search', methods=['GET'])
def search_books():
    try:
        query = request.args.get('query', '').lower()

        conn = sqlite3.connect(app.config["DATABASE"])
        cursor = conn.cursor()

        cursor.execute("""
        SELECT Books.book_id,
            Books.title,
            Books.publication_year,
            Books.image_url,
            Authors.name
        FROM Books
        LEFT JOIN book_author ON Books.book_id = book_author.book_id
        LEFT JOIN Authors ON book_author.author_id = Authors.author_id
        """)

        books = cursor.fetchall()
        conn.close()

        results = []

        for book in books:
            title = book[1] or ""
            author = book[4] or ""

            if query in title.lower() or query in author.lower():
                results.append({
                    'book_id': book[0],
                    'title': book[1],
                    'publication_year': book[2],
                    'image_url': book[3],
                    'author': book[4]
                })

        return jsonify({'books': results})

    except Exception as e:
        return jsonify({'error': str(e)})


# API to get all authors
@app.route('/api/authors', methods=['GET'])
def get_all_authors():
    try:
        conn = sqlite3.connect(app.config["DATABASE"])
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM Authors")
        authors = cursor.fetchall()
        conn.close()
        return jsonify(authors)
    except Exception as e:
        return jsonify({'error': str(e)})

# API to get all reviews
# @app.route('/api/reviews', methods=['GET'])
# def get_all_reviews():
#     try:
#         conn = sqlite3.connect(app.config["DATABASE"])
#         cursor = conn.cursor()
#         cursor.execute("SELECT * FROM Reviews")
#         reviews = cursor.fetchall()
#         conn.close()
#         return jsonify(reviews)
#     except Exception as e:
#         return jsonify({'error': str(e)})

# API to add a book to the database
@app.route('/api/add', methods=['POST'])
def add_book():
    try:
        conn = sqlite3.connect(app.config["DATABASE"])
        cursor = conn.cursor()

        data = request.get_json()
        title = data.get('title')
        publication_year = data.get('publication_year')
        author_name = data.get('author')
        image_url = data.get('image_url')

        # 1️ Insert book
        cursor.execute(
            "INSERT INTO Books (title, publication_year, image_url) VALUES (?, ?, ?)", #modified
            (title, publication_year, image_url)#modified
        )
        book_id = cursor.lastrowid

        # 2️ Check if author exists
        cursor.execute("SELECT author_id FROM Authors WHERE name = ?", (author_name,))
        author = cursor.fetchone()

        if author:
            author_id = author[0]
        else:
            cursor.execute("INSERT INTO Authors (name) VALUES (?)", (author_name,))
            author_id = cursor.lastrowid

        # 3️ Insert into book_author
        cursor.execute(
            "INSERT INTO book_author (book_id, author_id) VALUES (?, ?)",
            (book_id, author_id)
        )

        conn.commit()
        conn.close()

        return jsonify({'message': 'Book added successfully'})

    except Exception as e:
        return jsonify({'error': str(e)})

# API to get all reviews from MongoDB
@app.route('/api/reviews', methods=['GET'])
def get_all_reviews():
    try:
        reviews = list(reviews_collection.find({}, {'_id': 0}))  # Get all reviews from MongoDB
        return jsonify({'reviews': reviews})
    except Exception as e:
        return jsonify({'error': str(e)})

# API to add a new review to MongoDB
@app.route('/api/add_review', methods=['POST'])
def add_review():
    try:
        data = request.get_json()  # Get review details from the request
        book_id = data.get('book_id')
        user = data.get('user')
        rating = data.get('rating')
        comment = data.get('comment')

        # Insert the review into the MongoDB collection
        review = {
            'book_id': book_id,
            'user': user,
            'rating': rating,
            'comment': comment
        }
        reviews_collection.insert_one(review)

        return jsonify({'message': 'Review added successfully'})
    except Exception as e:
        return jsonify({'error': str(e)})


# Route to render the index.html page
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/delete_reviews', methods=['POST'])
def delete_reviews():
    data = request.get_json()
    book_id = data.get('book_id')

    reviews_collection.delete_many({"book_id": book_id})

    return jsonify({"message": "Reviews deleted"})

@app.route('/api/delete_book', methods=['POST'])
def delete_book():
    data = request.get_json()
    book_id = data.get('book_id')

    conn = sqlite3.connect(app.config["DATABASE"])
    cursor = conn.cursor()

    # Delete related records first
    cursor.execute("DELETE FROM book_author WHERE book_id=?", (book_id,))
    cursor.execute("DELETE FROM Books WHERE book_id=?", (book_id,))

    conn.commit()
    conn.close()

    return jsonify({"message": "Book deleted"})

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0")
