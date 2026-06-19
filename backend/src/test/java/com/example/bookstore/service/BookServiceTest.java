package com.example.bookstore.service;

import com.example.bookstore.domain.Book;
import com.example.bookstore.dto.BookRequest;
import com.example.bookstore.mapper.BookMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class BookServiceTest {

    private BookMapper bookMapper;
    private BookService bookService;

    @BeforeEach
    void setUp() {
        bookMapper = mock(BookMapper.class);
        bookService = new BookService(bookMapper);
    }

    @Test
    void listBooks_shouldDelegateToMapper() {
        when(bookMapper.findAll()).thenReturn(Collections.emptyList());
        List<Book> result = bookService.listBooks();
        assertNotNull(result);
        verify(bookMapper, times(1)).findAll();
    }

    @Test
    void createBook_shouldPersistAndReturnBook() {
        BookRequest request = new BookRequest();
        request.setName("Test");
        request.setAuthor("Author");
        request.setPrice(new BigDecimal("10.00"));
        request.setStock(5);

        ArgumentCaptor<Book> captor = ArgumentCaptor.forClass(Book.class);

        Book created = bookService.createBook(request);

        verify(bookMapper).insert(captor.capture());
        Book saved = captor.getValue();
        assertEquals("Test", saved.getName());
        assertEquals("Author", saved.getAuthor());

        assertEquals("Test", created.getName());
    }
}

