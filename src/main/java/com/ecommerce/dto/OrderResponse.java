package com.ecommerce.dto;

import com.ecommerce.entity.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private List<OrderItemResponse> items;
    private Double totalPrice;
    private OrderStatus status;
    private Long createdAt;
}