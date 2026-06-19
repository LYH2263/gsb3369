package com.example.bookstore.service;

import com.example.bookstore.domain.CartItem;
import com.example.bookstore.domain.Order;
import com.example.bookstore.domain.OrderItem;
import com.example.bookstore.dto.OrderCreateRequest;
import com.example.bookstore.mapper.BookMapper;
import com.example.bookstore.mapper.CartItemMapper;
import com.example.bookstore.mapper.OrderItemMapper;
import com.example.bookstore.mapper.OrderMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class OrderServiceTest {

    private OrderMapper orderMapper;
    private OrderItemMapper orderItemMapper;
    private CartItemMapper cartItemMapper;
    private BookMapper bookMapper;
    private OrderService orderService;

    @BeforeEach
    void setUp() {
        orderMapper = mock(OrderMapper.class);
        orderItemMapper = mock(OrderItemMapper.class);
        cartItemMapper = mock(CartItemMapper.class);
        bookMapper = mock(BookMapper.class);
        orderService = new OrderService(orderMapper, orderItemMapper, cartItemMapper, bookMapper);
    }

    @Test
    void listOrders_shouldLoadItems() {
        Order order = new Order();
        order.setId(1L);
        when(orderMapper.findByUserId(1L)).thenReturn(List.of(order));
        when(orderMapper.findItemsByOrderId(1L)).thenReturn(Collections.emptyList());

        List<Order> result = orderService.listOrders(1L, false);

        assertEquals(1, result.size());
        assertNotNull(result.get(0).getItems());
    }

    @Test
    void createOrderFromCart_shouldDecreaseStockAndClearCart() {
        CartItem cartItem = new CartItem();
        cartItem.setId(1L);
        cartItem.setUserId(1L);
        cartItem.setBookId(2L);
        cartItem.setQuantity(3);
        var book = new com.example.bookstore.domain.Book();
        book.setId(2L);
        book.setName("B");
        book.setPrice(new java.math.BigDecimal("10.00"));
        book.setStock(10);
        cartItem.setBook(book);

        when(cartItemMapper.findByUserId(1L)).thenReturn(List.of(cartItem));
        when(bookMapper.decreaseStock(2L, 3)).thenReturn(1);
        when(orderMapper.findItemsByOrderId(anyLong())).thenReturn(Collections.emptyList());

        Order created = orderService.createOrderFromCart(1L);

        assertNotNull(created);
        verify(orderMapper, times(1)).insert(any(Order.class));
        verify(orderItemMapper, times(1)).insert(any(OrderItem.class));
        verify(bookMapper, times(1)).decreaseStock(2L, 3);
        verify(cartItemMapper, times(1)).deleteByUserId(1L);
    }
}

