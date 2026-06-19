package com.example.bookstore.domain;

import lombok.Data;

@Data
public class CartItem {
    private Long id;
    private Long userId;
    private Long bookId;
    private Integer quantity;

    private Book book;
}

