package com.example.bookstore.web;

import com.example.bookstore.domain.CartItem;
import com.example.bookstore.service.CartService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CartController.class)
class CartControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CartService cartService;

    @Test
    void list_shouldReturn200() throws Exception {
        when(cartService.listCartItems(1L)).thenReturn(Collections.<CartItem>emptyList());
        mockMvc
                .perform(get("/api/cart").header("X-USER-ID", "1"))
                .andExpect(status().isOk());
    }
}

