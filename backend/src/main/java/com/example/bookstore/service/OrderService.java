package com.example.bookstore.service;

import com.example.bookstore.domain.CartItem;
import com.example.bookstore.domain.Order;
import com.example.bookstore.domain.OrderItem;
import com.example.bookstore.dto.OrderCreateRequest;
import com.example.bookstore.dto.PageResult;
import com.example.bookstore.mapper.BookMapper;
import com.example.bookstore.mapper.CartItemMapper;
import com.example.bookstore.mapper.OrderItemMapper;
import com.example.bookstore.mapper.OrderMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class OrderService {

    private final OrderMapper orderMapper;
    private final OrderItemMapper orderItemMapper;
    private final CartItemMapper cartItemMapper;
    private final BookMapper bookMapper;

    public OrderService(OrderMapper orderMapper,
                        OrderItemMapper orderItemMapper,
                        CartItemMapper cartItemMapper,
                        BookMapper bookMapper) {
        this.orderMapper = orderMapper;
        this.orderItemMapper = orderItemMapper;
        this.cartItemMapper = cartItemMapper;
        this.bookMapper = bookMapper;
    }

    public List<Order> listOrders(Long userId, boolean admin) {
        List<Order> orders = admin ? orderMapper.findAll() : orderMapper.findByUserId(userId);
        for (Order order : orders) {
            order.setItems(orderMapper.findItemsByOrderId(order.getId()));
        }
        return orders;
    }

    public PageResult<Order> listOrdersPaged(Long userId, boolean admin, int page, int size) {
        int offset = (page - 1) * size;
        List<Order> orders = admin
                ? orderMapper.findAllPaged(offset, size)
                : orderMapper.findByUserIdPaged(userId, offset, size);
        for (Order order : orders) {
            order.setItems(orderMapper.findItemsByOrderId(order.getId()));
        }
        long total = admin ? orderMapper.countAll() : orderMapper.countByUserId(userId);
        return new PageResult<>(orders, total, page, size);
    }

    public Order getOrder(Long id, Long userId, boolean admin) {
        Order order = orderMapper.findById(id);
        if (order == null) {
            return null;
        }
        if (!admin && (order.getUserId() == null || !order.getUserId().equals(userId))) {
            return null;
        }
        order.setItems(orderMapper.findItemsByOrderId(order.getId()));
        return order;
    }

    @Transactional
    public Order createOrderFromCart(Long userId) {
        List<CartItem> cartItems = cartItemMapper.findByUserId(userId);
        if (cartItems.isEmpty()) {
            return null;
        }
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (CartItem c : cartItems) {
            BigDecimal price = c.getBook().getPrice();
            total = total.add(price.multiply(BigDecimal.valueOf(c.getQuantity())));
            OrderItem item = new OrderItem();
            item.setBookId(c.getBookId());
            item.setQuantity(c.getQuantity());
            item.setPrice(price);
            items.add(item);
        }
        Order order = new Order();
        order.setUserId(userId);
        order.setTotalAmount(total);
        order.setStatus("CREATED");
        orderMapper.insert(order);

        for (OrderItem item : items) {
            item.setOrderId(order.getId());
            orderItemMapper.insert(item);
            int updated = bookMapper.decreaseStock(item.getBookId(), item.getQuantity());
            if (updated == 0) {
                throw new IllegalStateException("库存不足或图书不存在");
            }
        }
        cartItemMapper.deleteByUserId(userId);
        order.setItems(orderMapper.findItemsByOrderId(order.getId()));
        return order;
    }

    @Transactional
    public Order createOrder(Long userId, OrderCreateRequest request) {
        BigDecimal total = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();
        for (OrderCreateRequest.Item i : request.getItems()) {
            var book = bookMapper.findById(i.getBookId());
            if (book == null) {
                throw new IllegalArgumentException("图书不存在: " + i.getBookId());
            }
            BigDecimal price = book.getPrice();
            total = total.add(price.multiply(BigDecimal.valueOf(i.getQuantity())));
            OrderItem item = new OrderItem();
            item.setBookId(i.getBookId());
            item.setQuantity(i.getQuantity());
            item.setPrice(price);
            items.add(item);
        }
        if (items.isEmpty()) {
            return null;
        }
        Order order = new Order();
        order.setUserId(userId);
        order.setTotalAmount(total);
        order.setStatus("CREATED");
        orderMapper.insert(order);

        for (OrderItem item : items) {
            item.setOrderId(order.getId());
            orderItemMapper.insert(item);
            int updated = bookMapper.decreaseStock(item.getBookId(), item.getQuantity());
            if (updated == 0) {
                throw new IllegalStateException("库存不足或图书不存在");
            }
            cartItemMapper.deleteByUserAndBook(userId, item.getBookId());
        }
        order.setItems(orderMapper.findItemsByOrderId(order.getId()));
        return order;
    }
}

