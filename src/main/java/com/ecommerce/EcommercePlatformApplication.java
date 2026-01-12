package com.ecommerce;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EntityScan(basePackages = "com.ecommerce.entity")
@EnableJpaRepositories(basePackages = "com.ecommerce.repository")
public class EcommercePlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(EcommercePlatformApplication.class, args);
	}
}
