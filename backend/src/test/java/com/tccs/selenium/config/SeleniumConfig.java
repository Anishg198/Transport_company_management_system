package com.tccs.selenium.config;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;

/**
 * Centralised ChromeDriver factory.
 *
 * Toggle headless mode via the system property {@code headless} (default: false).
 * Set via Maven: {@code mvn verify -Dselenium.headless=true}
 *
 * The frontend base URL is read from the system property {@code frontend.url}
 * (default: {@value #DEFAULT_FRONTEND_URL}).
 */
public final class SeleniumConfig {

    public static final String DEFAULT_FRONTEND_URL = "http://localhost:5173";

    private SeleniumConfig() {}

    /** Returns a ready-to-use ChromeDriver, managed by WebDriverManager. */
    public static WebDriver createDriver() {
        WebDriverManager.chromedriver().setup();

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--no-sandbox");
        options.addArguments("--disable-dev-shm-usage");
        options.addArguments("--disable-gpu");
        options.addArguments("--window-size=1440,900");
        options.addArguments("--remote-allow-origins=*");

        boolean headless = Boolean.parseBoolean(
                System.getProperty("headless", "false"));
        if (headless) {
            options.addArguments("--headless=new");
        }

        return new ChromeDriver(options);
    }

    /** Returns the configured frontend base URL (no trailing slash). */
    public static String getFrontendUrl() {
        String url = System.getProperty("frontend.url", DEFAULT_FRONTEND_URL);
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }
}
