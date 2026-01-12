package com.ecommerce.dto;

import lombok.Data;

@Data
public class CartItemResponse {
    private Long id;
    private ProductResponse product;
    private Integer quantity;
    private Double subtotal;
}