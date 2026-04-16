package com.tccs.selenium;

import com.tccs.selenium.config.SeleniumConfig;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Base class for all Selenium integration tests.
 *
 * <p>Provides:
 * <ul>
 *   <li>A fresh {@link WebDriver} per test method (created in {@link #setUp}, torn
 *       down in {@link #tearDown}).</li>
 *   <li>A pre-configured {@link WebDriverWait} with a sensible default timeout.</li>
 *   <li>The resolved {@link #BASE_URL} for the React frontend.</li>
 * </ul>
 */
public abstract class BaseSeleniumTest {

    protected static final Duration DEFAULT_WAIT = Duration.ofSeconds(10);

    protected final String BASE_URL = SeleniumConfig.getFrontendUrl();

    protected WebDriver driver;
    protected WebDriverWait wait;

    @BeforeEach
    void setUp() {
        // Retry up to 3 times with a short pause — Chrome startup can transiently
        // fail after many prior instances when running the full test suite.
        Exception lastError = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            try {
                if (attempt > 1) Thread.sleep(3000);
                driver = SeleniumConfig.createDriver();
                wait = new WebDriverWait(driver, DEFAULT_WAIT);
                return;
            } catch (Exception e) {
                lastError = e;
            }
        }
        throw new RuntimeException("WebDriver creation failed after 3 attempts", lastError);
    }

    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }

    /** Navigate to a path relative to the frontend base URL. */
    protected void navigate(String path) {
        driver.get(BASE_URL + path);
    }
}
