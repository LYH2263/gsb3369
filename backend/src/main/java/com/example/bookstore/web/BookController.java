package com.example.bookstore.web;

import com.example.bookstore.domain.Book;
import com.example.bookstore.dto.BookRequest;
import com.example.bookstore.dto.PageResult;
import com.example.bookstore.service.BookService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/books")
@Validated
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public PageResult<Book> list(@RequestParam(defaultValue = "1") int page,
                                 @RequestParam(defaultValue = "8") int size) {
        return bookService.listBooksPaged(page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Book> get(@PathVariable Long id) {
        Book book = bookService.getBook(id);
        if (book == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(book);
    }

    @PostMapping
    public ResponseEntity<Book> create(@RequestHeader(value = "X-ROLE", required = false) String role,
                                       @Valid @RequestBody BookRequest request) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(bookService.createBook(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Book> update(@RequestHeader(value = "X-ROLE", required = false) String role,
                                       @PathVariable Long id,
                                       @Valid @RequestBody BookRequest request) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        Book updated = bookService.updateBook(id, request);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@RequestHeader(value = "X-ROLE", required = false) String role,
                                       @PathVariable Long id) {
        if (role == null || !role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        boolean deleted = bookService.deleteBook(id);
        if (!deleted) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}

