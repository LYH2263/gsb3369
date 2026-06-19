package com.example.bookstore.domain;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Order {
    private Long id;
    private Long userId;
    /** 购买用户名称，管理员查看订单列表/详情时由 join users 表填充 */
    private String userName;
    private BigDecimal totalAmount;
    private String status;
    private LocalDateTime createdAt;

    private List<OrderItem> items;
}

