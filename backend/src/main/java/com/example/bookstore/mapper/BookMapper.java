package com.example.bookstore.mapper;

import com.example.bookstore.domain.Book;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface BookMapper {

    @Select("SELECT * FROM books ORDER BY id DESC")
    List<Book> findAll();

    @Select("SELECT * FROM books ORDER BY id DESC LIMIT #{size} OFFSET #{offset}")
    List<Book> findPage(@Param("offset") int offset, @Param("size") int size);

    @Select("SELECT COUNT(*) FROM books")
    long countAll();

    @Select("SELECT * FROM books WHERE id = #{id}")
    Book findById(Long id);

    @Insert("INSERT INTO books(name, author, price, stock) VALUES(#{name}, #{author}, #{price}, #{stock})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insert(Book book);

    @Update("UPDATE books SET name=#{name}, author=#{author}, price=#{price}, stock=#{stock} WHERE id=#{id}")
    int update(Book book);

    @Delete("DELETE FROM books WHERE id=#{id}")
    int delete(Long id);

    @Update("UPDATE books SET stock = stock - #{quantity} WHERE id = #{bookId} AND stock >= #{quantity}")
    int decreaseStock(@Param("bookId") Long bookId, @Param("quantity") int quantity);
}

