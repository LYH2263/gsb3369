package com.example.bookstore.service;

import com.example.bookstore.domain.CartItem;
import com.example.bookstore.mapper.CartItemMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CartService {

    private final CartItemMapper cartItemMapper;

    public CartService(CartItemMapper cartItemMapper) {
        this.cartItemMapper = cartItemMapper;
    }

    public List<CartItem> listCartItems(Long userId) {
        return cartItemMapper.findByUserId(userId);
    }

    @Transactional
    public void addToCart(Long userId, Long bookId, int quantity) {
        CartItem existing = cartItemMapper.findByUserAndBook(userId, bookId);
        if (existing == null) {
            CartItem item = new CartItem();
            item.setUserId(userId);
            item.setBookId(bookId);
            item.setQuantity(quantity);
            cartItemMapper.insert(item);
        } else {
            int newQty = existing.getQuantity() + quantity;
            cartItemMapper.updateQuantity(existing.getId(), newQty);
        }
    }

    @Transactional
    public void updateQuantity(Long cartItemId, int quantity) {
        cartItemMapper.updateQuantity(cartItemId, quantity);
    }

    @Transactional
    public void removeItem(Long cartItemId) {
        cartItemMapper.delete(cartItemId);
    }

    @Transactional
    public void clearCart(Long userId) {
        cartItemMapper.deleteByUserId(userId);
    }
}

