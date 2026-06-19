package com.example.bookstore.service;

import com.example.bookstore.domain.CartItem;
import com.example.bookstore.mapper.CartItemMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.mockito.Mockito.*;

class CartServiceTest {

    private CartItemMapper cartItemMapper;
    private CartService cartService;

    @BeforeEach
    void setUp() {
        cartItemMapper = mock(CartItemMapper.class);
        cartService = new CartService(cartItemMapper);
    }

    @Test
    void addToCart_whenNotExists_shouldInsert() {
        when(cartItemMapper.findByUserAndBook(1L, 10L)).thenReturn(null);

        cartService.addToCart(1L, 10L, 2);

        verify(cartItemMapper, times(1)).insert(any(CartItem.class));
        verify(cartItemMapper, never()).updateQuantity(anyLong(), anyInt());
    }

    @Test
    void addToCart_whenExists_shouldUpdateQuantity() {
        CartItem existing = new CartItem();
        existing.setId(5L);
        existing.setUserId(1L);
        existing.setBookId(10L);
        existing.setQuantity(3);
        when(cartItemMapper.findByUserAndBook(1L, 10L)).thenReturn(existing);

        cartService.addToCart(1L, 10L, 2);

        verify(cartItemMapper, times(1)).updateQuantity(5L, 5);
        verify(cartItemMapper, never()).insert(any(CartItem.class));
    }
}

