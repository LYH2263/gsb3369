package com.example.bookstore.domain;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class Book {
    private Long id;
    private String name;
    private String author;
    private BigDecimal price;
    private Integer stock;
}

