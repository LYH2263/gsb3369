package com.example.bookstore.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import java.util.List;

@Data
public class OrderCreateRequest {

    @NotEmpty
    private List<Item> items;

    @Data
    public static class Item {
        @NotNull
        private Long bookId;

        @NotNull
        @Min(1)
        private Integer quantity;
    }
}

