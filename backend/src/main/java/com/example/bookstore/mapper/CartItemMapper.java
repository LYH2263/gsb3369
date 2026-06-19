package com.example.bookstore.mapper;

import com.example.bookstore.domain.CartItem;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface CartItemMapper {

    @Select("SELECT ci.*, b.id AS b_id, b.name AS b_name, b.author AS b_author, b.price AS b_price, b.stock AS b_stock " +
            "FROM cart_items ci JOIN books b ON ci.book_id = b.id WHERE ci.user_id = #{userId}")
    @Results(id = "cartItemResult", value = {
            @Result(column = "id", property = "id"),
            @Result(column = "user_id", property = "userId"),
            @Result(column = "book_id", property = "bookId"),
            @Result(column = "quantity", property = "quantity"),
            @Result(property = "book.id", column = "b_id"),
            @Result(property = "book.name", column = "b_name"),
            @Result(property = "book.author", column = "b_author"),
            @Result(property = "book.price", column = "b_price"),
            @Result(property = "book.stock", column = "b_stock")
    })
    List<CartItem> findByUserId(Long userId);

    @Select("SELECT * FROM cart_items WHERE user_id = #{userId} AND book_id = #{bookId}")
    CartItem findByUserAndBook(@Param("userId") Long userId, @Param("bookId") Long bookId);

    @Insert("INSERT INTO cart_items(user_id, book_id, quantity) VALUES(#{userId}, #{bookId}, #{quantity})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(CartItem cartItem);

    @Update("UPDATE cart_items SET quantity = #{quantity} WHERE id = #{id}")
    int updateQuantity(@Param("id") Long id, @Param("quantity") int quantity);

    @Delete("DELETE FROM cart_items WHERE id = #{id}")
    int delete(Long id);

    @Delete("DELETE FROM cart_items WHERE user_id = #{userId}")
    int deleteByUserId(Long userId);

    @Delete("DELETE FROM cart_items WHERE user_id = #{userId} AND book_id = #{bookId}")
    int deleteByUserAndBook(@Param("userId") Long userId, @Param("bookId") Long bookId);
}

