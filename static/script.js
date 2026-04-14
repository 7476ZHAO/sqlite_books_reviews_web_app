// Array to store book data
const books = [];

// Function to add a book to the list and send it to the server
function addBook() {
  const bookTitle = document.getElementById("bookTitle").value;
  const publicationYear = document.getElementById("publicationYear").value;
  const author = document.getElementById("author").value;
  const imageUrl = document.getElementById("image_url").value;

  const bookData = {
    title: bookTitle,
    publication_year: publicationYear,
    author: author,
    image_url: imageUrl,
  };

  fetch("/api/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.error) {
        alert(data.error);
        return;
      }

      showAllBooks();
    })
    .catch((error) => {
      console.error("Error adding book:", error);
    });
}

// Function to display books in the list
function displayBooks() {
  const bookList = document.getElementById("bookList");
  bookList.innerHTML = ""; // Clear existing book list

  books.forEach((book) => {
    const bookElement = document.createElement("div");
    bookElement.className = "book"; // added: apply CSS book styling (border, shadow, hover)

    bookElement.innerHTML = `
            ${book.image_url ? `<img src="${book.image_url}">` : ""}  <!-- modified: show cover image -->
            <h3>${book.title}</h3> <!-- modified: title styled by CSS -->
            <p>${book.author}</p> <!-- modified: author shown clearly -->
        `;

    bookList.appendChild(bookElement);
  });
}

// Function to fetch and display all books from the server
async function showAllBooks() {
  try {
    // Fetch all books from SQLite
    const bookRes = await fetch("/api/books");
    const bookData = await bookRes.json();

    // Fetch all reviews from MongoDB
    const reviewRes = await fetch("/api/reviews");
    const reviewData = await reviewRes.json();

    const reviews = reviewData.reviews;

    // Get container and template
    const bookList = document.getElementById("allbooks");
    const template = document.getElementById("book-template");

    bookList.innerHTML = ""; // Clear previous content

    // Loop through all books
    bookData.books.forEach((book) => {
      // Clone template
      const bookElement = template.cloneNode(true);
      bookElement.style.display = "block";
      bookElement.removeAttribute("id");

      // Fill book info
      bookElement.querySelector(".book-title").innerText = book.title;
      bookElement.querySelector(".book-author").innerText = book.author;

      const img = bookElement.querySelector(".book-img");
      if (book.image_url) {
        img.src = book.image_url;
      } else {
        img.style.display = "none";
      }

      // Match reviews using book_id (core logic)
      const bookReviews = reviews.filter(
        (r) => Number(r.book_id) === Number(book.book_id),
      );

      const reviewDiv = bookElement.querySelector(".book-reviews");
      reviewDiv.innerHTML = ""; // Clear old reviews
      reviewDiv.style.display = "none"; // Hide by default

      if (bookReviews.length === 0) {
        reviewDiv.innerHTML = "<p>No review yet</p>";
      } else {
        // Display reviews with numbering (1,2,3...)
        bookReviews.forEach((r, index) => {
          const p = document.createElement("p");
          p.innerText = `${index + 1}. ${r.comment}`;
          reviewDiv.appendChild(p);
        });
      }

      // View Reviews button (toggle visibility)
      bookElement.querySelector(".view-btn").onclick = () => {
        if (reviewDiv.style.display === "block") {
          reviewDiv.style.display = "none";
        } else {
          reviewDiv.style.display = "block";
        }
      };

      // Comment button (add review)
      bookElement.querySelector(".comment-btn").onclick = () => {
        addSimpleReview(book.book_id);
      };

      bookElement.querySelector(".delete-btn").onclick = async function () {
        const confirmDelete = confirm("Delete all reviews for this book?");
        if (!confirmDelete) return;

        await fetch("/api/delete_reviews", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ book_id: book.book_id }),
        });

        showAllBooks(); // refresh page
      };

      bookElement.querySelector(".delete-book-btn").onclick = async () => {
        const confirmDelete = confirm("Delete this book?");
        if (!confirmDelete) return;

        await fetch("/api/delete_book", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ book_id: book.book_id }),
        });

        showAllBooks();
      };

      // Append to page
      bookList.appendChild(bookElement);
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

async function searchBooks() {
  const query = document.getElementById("searchBox").value;

  try {
    // Fetch filtered books from SQLite
    const bookRes = await fetch(`/api/search?query=${query}`);
    const bookData = await bookRes.json();

    // Fetch all reviews from MongoDB
    const reviewRes = await fetch("/api/reviews");
    const reviewData = await reviewRes.json();

    const reviews = reviewData.reviews;

    // Get container and template
    const bookList = document.getElementById("allbooks");
    const template = document.getElementById("book-template");

    bookList.innerHTML = ""; // Clear previous results

    if (bookData.books.length === 0) {
      bookList.innerHTML = "<p>No books found 😢</p>";
      return;
    }

    // Loop through filtered books
    bookData.books.forEach((book) => {
      // Clone template
      const bookElement = template.cloneNode(true);
      bookElement.style.display = "block";
      bookElement.removeAttribute("id");

      // Fill book info
      bookElement.querySelector(".book-title").innerText = book.title;
      bookElement.querySelector(".book-author").innerText = book.author;

      const img = bookElement.querySelector(".book-img");
      if (book.image_url) {
        img.src = book.image_url;
      } else {
        img.style.display = "none";
      }

      // Match reviews using book_id (core logic)
      const bookReviews = reviews.filter(
        (r) => Number(r.book_id) === Number(book.book_id),
      );

      const reviewDiv = bookElement.querySelector(".book-reviews");
      reviewDiv.innerHTML = ""; // Clear old content
      reviewDiv.style.display = "none"; // Hide by default

      if (bookReviews.length === 0) {
        reviewDiv.innerHTML = "<p>No review yet</p>";
      } else {
        // Display reviews with numbering (1,2,3...)
        bookReviews.forEach((r, index) => {
          const p = document.createElement("p");
          p.innerText = `${index + 1}. ${r.comment}`;
          reviewDiv.appendChild(p);
        });
      }

      // View Reviews button (toggle visibility)
      bookElement.querySelector(".view-btn").onclick = () => {
        if (reviewDiv.style.display === "block") {
          reviewDiv.style.display = "none";
        } else {
          reviewDiv.style.display = "block";
        }
      };

      // Comment button (add new review)
      bookElement.querySelector(".comment-btn").onclick = () => {
        addSimpleReview(book.book_id);
      };

      // Append to page
      bookList.appendChild(bookElement);
    });
  } catch (error) {
    console.error("Error searching books:", error);
  }
}

function addSimpleReview(book_id) {
  const comment = prompt("Enter your review:");

  if (!comment) return;

  fetch("/api/add_review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      book_id: book_id,
      comment: comment,
      user: "anonymous",
      rating: 5,
    }),
  })
    .then((res) => res.json())
    .then(() => {
      alert("Saved!");
      showAllBooks(); // refresh page
    });
}
