package com.example.bookstore.web;

import com.example.bookstore.domain.Order;
import com.example.bookstore.dto.PageResult;
import com.example.bookstore.service.OrderService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderService orderService;

    @Test
    void list_shouldReturn200() throws Exception {
        when(orderService.listOrdersPaged(eq(1L), eq(false), anyInt(), anyInt()))
                .thenReturn(new PageResult<>(Collections.emptyList(), 0, 1, 8));
        mockMvc
                .perform(get("/api/orders").header("X-USER-ID", "1").header("X-ROLE", "USER"))
                .andExpect(status().isOk());
    }
}

