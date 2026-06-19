package com.example.bookstore.mapper;

import com.example.bookstore.domain.Order;
import com.example.bookstore.domain.OrderItem;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface OrderMapper {

    @Insert("INSERT INTO orders(user_id, total_amount, status) VALUES(#{userId}, #{totalAmount}, #{status})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Order order);

    @Select("SELECT * FROM orders WHERE user_id = #{userId} ORDER BY created_at DESC")
    List<Order> findByUserId(Long userId);

    @Select("SELECT o.*, u.username AS user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC")
    @Result(column = "user_name", property = "userName")
    List<Order> findAll();

    @Select("SELECT o.*, u.username AS user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT #{limit} OFFSET #{offset}")
    @Result(column = "user_name", property = "userName")
    List<Order> findAllPaged(@Param("offset") int offset, @Param("limit") int limit);

    @Select("SELECT * FROM orders WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit} OFFSET #{offset}")
    List<Order> findByUserIdPaged(@Param("userId") Long userId, @Param("offset") int offset, @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM orders WHERE user_id = #{userId}")
    long countByUserId(Long userId);

    @Select("SELECT COUNT(*) FROM orders")
    long countAll();

    @Select("SELECT o.*, u.username AS user_name FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE o.id = #{id}")
    @Result(column = "user_name", property = "userName")
    Order findById(Long id);

    @Select("SELECT oi.*, b.id AS b_id, b.name AS b_name, b.author AS b_author, b.price AS b_price, b.stock AS b_stock " +
            "FROM order_items oi JOIN books b ON oi.book_id = b.id WHERE oi.order_id = #{orderId}")
    @Results(id = "orderItemWithBook", value = {
            @Result(column = "id", property = "id"),
            @Result(column = "order_id", property = "orderId"),
            @Result(column = "book_id", property = "bookId"),
            @Result(column = "quantity", property = "quantity"),
            @Result(column = "price", property = "price"),
            @Result(property = "book.id", column = "b_id"),
            @Result(property = "book.name", column = "b_name"),
            @Result(property = "book.author", column = "b_author"),
            @Result(property = "book.price", column = "b_price"),
            @Result(property = "book.stock", column = "b_stock")
    })
    List<OrderItem> findItemsByOrderId(Long orderId);
}

