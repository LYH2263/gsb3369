package com.example.bookstore.service;

import com.example.bookstore.domain.Book;
import com.example.bookstore.dto.BookRequest;
import com.example.bookstore.dto.PageResult;
import com.example.bookstore.mapper.BookMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BookService {

    private final BookMapper bookMapper;

    public BookService(BookMapper bookMapper) {
        this.bookMapper = bookMapper;
    }

    public List<Book> listBooks() {
        return bookMapper.findAll();
    }

    public PageResult<Book> listBooksPaged(int page, int size) {
        if (page < 1) {
            page = 1;
        }
        if (size <= 0 || size > 100) {
            size = 8;
        }
        int offset = (page - 1) * size;
        List<Book> content = bookMapper.findPage(offset, size);
        long total = bookMapper.countAll();
        return new PageResult<>(content, total, page, size);
    }

    public Book getBook(Long id) {
        return bookMapper.findById(id);
    }

    @Transactional
    public Book createBook(BookRequest request) {
        Book book = new Book();
        book.setName(request.getName());
        book.setAuthor(request.getAuthor());
        book.setPrice(request.getPrice());
        book.setStock(request.getStock());
        bookMapper.insert(book);
        return book;
    }

    @Transactional
    public Book updateBook(Long id, BookRequest request) {
        Book existing = bookMapper.findById(id);
        if (existing == null) {
            return null;
        }
        existing.setName(request.getName());
        existing.setAuthor(request.getAuthor());
        existing.setPrice(request.getPrice());
        existing.setStock(request.getStock());
        bookMapper.update(existing);
        return existing;
    }

    @Transactional
    public boolean deleteBook(Long id) {
        return bookMapper.delete(id) > 0;
    }
}

