package com.ecommerce.service;

import com.ecommerce.dto.AuthResponse;
import com.ecommerce.dto.LoginRequest;
import com.ecommerce.dto.RegisterRequest;
import com.ecommerce.entity.Role;
import com.ecommerce.entity.User;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.stream.Collectors;

@Service
public class AuthService {

    private static final Logger logger = LoggerFactory.getLogger(AuthService.class);

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    public AuthResponse register(RegisterRequest request) {
        logger.info("Registering user: " + request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            logger.warn("Email already exists: " + request.getEmail());
            throw new RuntimeException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRoles(Collections.singleton(Role.ROLE_USER));

        userRepository.save(user);
        logger.info("User registered successfully: " + request.getEmail());

        String token = jwtTokenProvider.generateToken(user.getEmail());
        AuthResponse response = new AuthResponse(token, user.getEmail(), user.getFirstName(), user.getLastName());
        response.setRoles(user.getRoles().stream().map(Role::toString).collect(Collectors.toSet()));
        return response;
    }

    public AuthResponse login(LoginRequest request) {
        logger.info("Login attempt for: " + request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    logger.warn("User not found: " + request.getEmail());
                    return new RuntimeException("User not found");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            logger.warn("Invalid password for user: " + request.getEmail());
            throw new RuntimeException("Invalid password");
        }

        logger.info("User logged in successfully: " + request.getEmail());
        String token = jwtTokenProvider.generateToken(user.getEmail());
        AuthResponse response = new AuthResponse(token, user.getEmail(), user.getFirstName(), user.getLastName());
        response.setRoles(user.getRoles().stream().map(Role::toString).collect(Collectors.toSet()));
        return response;
    }
}

//package com.ecommerce.service;
//
//import com.ecommerce.dto.AuthResponse;
//import com.ecommerce.dto.LoginRequest;
//import com.ecommerce.dto.RegisterRequest;
//import com.ecommerce.entity.Role;
//import com.ecommerce.entity.User;
//import com.ecommerce.repository.UserRepository;
//import com.ecommerce.security.JwtTokenProvider;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.stereotype.Service;
//import java.util.Collections;
//
//@Service
//public class AuthService {
//
//    @Autowired
//    private UserRepository userRepository;
//
//    @Autowired
//    private PasswordEncoder passwordEncoder;
//
//    @Autowired
//    private JwtTokenProvider jwtTokenProvider;
//
//    public AuthResponse register(RegisterRequest request) {
//        if (userRepository.existsByEmail(request.getEmail())) {
//            throw new RuntimeException("Email already exists");
//        }
//
//        User user = new User();
//        user.setEmail(request.getEmail());
//        user.setPassword(passwordEncoder.encode(request.getPassword()));
//        user.setFirstName(request.getFirstName());
//        user.setLastName(request.getLastName());
//        user.setRoles(Collections.singleton(Role.ROLE_USER));
//
//        userRepository.save(user);
//
//        String token = jwtTokenProvider.generateToken(user.getEmail());
//        return new AuthResponse(token, user.getEmail(), user.getFirstName(), user.getLastName());
//    }
//
//    public AuthResponse login(LoginRequest request) {
//        User user = userRepository.findByEmail(request.getEmail())
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
//            throw new RuntimeException("Invalid password");
//        }
//
//        String token = jwtTokenProvider.generateToken(user.getEmail());
//        return new AuthResponse(token, user.getEmail(), user.getFirstName(), user.getLastName());
//    }
//}