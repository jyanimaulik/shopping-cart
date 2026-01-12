package com.ecommerce.controller;

import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartResponse;
import com.ecommerce.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "http://localhost:8080")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> getCart() {
        return ResponseEntity.ok(cartService.getCart());
    }

    @PostMapping("/items")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> addToCart(@RequestBody CartItemRequest request) {
        return new ResponseEntity<>(cartService.addToCart(request), HttpStatus.CREATED);
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> updateCartItem(@PathVariable Long itemId,
                                                       @RequestParam Integer quantity) {
        return ResponseEntity.ok(cartService.updateCartItem(itemId, quantity));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<CartResponse> removeFromCart(@PathVariable Long itemId) {
        return ResponseEntity.ok(cartService.removeFromCart(itemId));
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> clearCart() {
        cartService.clearCart();
        return ResponseEntity.noContent().build();
    }
}