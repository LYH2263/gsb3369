package com.example.bookstore.web;

import com.example.bookstore.domain.Order;
import com.example.bookstore.dto.OrderCreateRequest;
import com.example.bookstore.dto.PageResult;
import com.example.bookstore.service.OrderService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/orders")
@Validated
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping
    public PageResult<Order> list(@RequestHeader("X-USER-ID") Long userId,
                                  @RequestHeader(value = "X-ROLE", required = false) String role,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "8") int size) {
        boolean admin = role != null && role.equalsIgnoreCase("ADMIN");
        return orderService.listOrdersPaged(userId, admin, page, size);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> get(@PathVariable Long id,
                                     @RequestHeader("X-USER-ID") Long userId,
                                     @RequestHeader(value = "X-ROLE", required = false) String role) {
        boolean admin = role != null && role.equalsIgnoreCase("ADMIN");
        Order order = orderService.getOrder(id, userId, admin);
        if (order == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping("/from-cart")
    public ResponseEntity<Order> createFromCart(@RequestHeader("X-USER-ID") Long userId,
                                                @RequestHeader(value = "X-ROLE", required = false) String role) {
        if (role != null && role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        Order order = orderService.createOrderFromCart(userId);
        if (order == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(order);
    }

    @PostMapping
    public ResponseEntity<Order> create(@RequestHeader("X-USER-ID") Long userId,
                                        @RequestHeader(value = "X-ROLE", required = false) String role,
                                        @Valid @RequestBody OrderCreateRequest request) {
        if (role != null && role.equalsIgnoreCase("ADMIN")) {
            return ResponseEntity.status(403).build();
        }
        Order order = orderService.createOrder(userId, request);
        if (order == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(order);
    }
}

