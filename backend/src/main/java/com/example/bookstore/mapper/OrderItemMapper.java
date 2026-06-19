package com.example.bookstore.mapper;

import com.example.bookstore.domain.OrderItem;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Options;

@Mapper
public interface OrderItemMapper {

    @Insert("INSERT INTO order_items(order_id, book_id, quantity, price) " +
            "VALUES(#{orderId}, #{bookId}, #{quantity}, #{price})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(OrderItem item);
}

