// Array to store book data
const books = [];

// Function to add a book to the list and send it to the server
function addBook() {
    const bookTitle = document.getElementById('bookTitle').value;
    const publicationYear = document.getElementById('publicationYear').value;

    // Create a JSON object with book data
    const bookData = {
        title: bookTitle,
        publication_year: publicationYear
    };

    // Send the book data to the server via POST request
    fetch('/api/add_book', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookData)
    })
        .then(response => response.json())
        .then(data => {
            // Display a success message or handle errors if needed
            console.log(data.message);

            // Add the new book data to the books array
            books.push(bookData);
            console.log(books)

            // Refresh the book list
            displayBooks();
        })
        .catch(error => {
            console.error('Error adding book:', error);
        });
}

// Function to display books in the list with bookshelf style
function displayBooks() {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = ''; // Clear existing book list

    books.forEach(book => {
        const bookElement = document.createElement('div');
        bookElement.classList.add('book');
        bookElement.innerHTML = `
            <h2 class="book-title">${book.title}</h2>
            <p class="book-year">(${book.publication_year})</p>
        `;
        bookList.appendChild(bookElement);
    });
}

// Function to fetch and display all books from the server
function showAllBooks() {
    fetch('/api/books')
        .then(response => response.json())
        .then(data => {
            const bookList = document.getElementById('allbooks');
            bookList.innerHTML = ''; // Clear existing book list
            console.log(data);
            data.books.forEach(book => {
                const bookElement = document.createElement('div');
                bookElement.classList.add('book');
                bookElement.innerHTML = `
                    <h2 class="book-title">${book.book_id}</h2>
                    <h2 class="book-title">${book.title}</h2>
                    <p class="book-year">(${book.publication_year})</p>
                `;
                bookList.appendChild(bookElement);
            });
        })
        .catch(error => {
            console.error('Error fetching all books:', error);
        });
}

// Function to add a review
function addReview() {
    const bookId = document.getElementById('bookId').value;
    const userName = document.getElementById('userName').value;
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    const reviewData = {
        book_id: bookId,
        user: userName,
        rating: rating,
        comment: comment
    };

    fetch('/api/add_review', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(reviewData)
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
            showAllReviews();  // Refresh reviews after adding
        })
        .catch(error => {
            console.error('Error adding review:', error);
        });
}

// Function to fetch and display all reviews
function showAllReviews() {
    fetch('/api/reviews')
        .then(response => response.json())
        .then(data => {
            const reviewList = document.getElementById('reviewList');
            reviewList.innerHTML = '';  // Clear existing reviews

            data.reviews.forEach(review => {
                const reviewElement = document.createElement('div');
                reviewElement.classList.add('review');
                reviewElement.innerHTML = `
                    <h3>Book ID: ${review.book_id}</h3>
                    <p>User: ${review.user}</p>
                    <p>Rating: ${review.rating}</p>
                    <p>Comment: ${review.comment}</p>
                `;
                reviewList.appendChild(reviewElement);
            });
        })
        .catch(error => {
            console.error('Error fetching reviews:', error);
        });
}

