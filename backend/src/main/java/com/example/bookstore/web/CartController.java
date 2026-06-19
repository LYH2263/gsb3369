package com.example.bookstore.web;

import com.example.bookstore.domain.CartItem;
import com.example.bookstore.service.CartService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import java.util.List;

@RestController
@RequestMapping("/api/cart")
@Validated
public class CartController {

    private final CartService cartService;

    public CartController(CartService cartService) {
        this.cartService = cartService;
    }

    @GetMapping
    public List<CartItem> list(@RequestHeader("X-USER-ID") Long userId) {
        return cartService.listCartItems(userId);
    }

    @PostMapping
    public ResponseEntity<Void> add(@RequestHeader("X-USER-ID") Long userId,
                                    @RequestHeader(value = "X-ROLE", required = false) String role,
                                    @RequestParam @NotNull Long bookId,
                                    @RequestParam @Min(1) int quantity) {
        if (role != null && role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        cartService.addToCart(userId, bookId, quantity);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Void> update(@PathVariable Long id,
                                       @RequestParam @Min(1) int quantity) {
        cartService.updateQuantity(id, quantity);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cartService.removeItem(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Void> clear(@RequestHeader("X-USER-ID") Long userId) {
        cartService.clearCart(userId);
        return ResponseEntity.noContent().build();
    }
}

