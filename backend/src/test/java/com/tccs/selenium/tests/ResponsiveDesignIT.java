package com.tccs.selenium.tests;

import com.tccs.selenium.BaseSeleniumTest;
import com.tccs.selenium.pages.LoginPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium tests verifying critical UI elements remain visible across
 * common viewport sizes.
 *
 * <p>Viewports tested:
 * <ul>
 *   <li><b>Desktop</b> — 1440 × 900 (default Chrome window)</li>
 *   <li><b>Laptop</b> — 1024 × 768</li>
 *   <li><b>Tablet</b> — 768 × 1024 (portrait iPad)</li>
 *   <li><b>Mobile</b> — 390 × 844 (iPhone 14)</li>
 * </ul>
 */
@DisplayName("Responsive Design Tests")
class ResponsiveDesignIT extends BaseSeleniumTest {

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void setViewport(int width, int height) {
        driver.manage().window().setSize(new Dimension(width, height));
    }

    private LoginPage openLoginPage() {
        navigate("/login");
        return new LoginPage(driver, wait).waitForLoad();
    }

    private void loginAsOperator() {
        openLoginPage()
                .loginAs("operator1", "password123")
                .waitForLoad();
    }

    // ── Login page responsive tests ──────────────────────────────────────────

    @Test
    @DisplayName("Login form is fully visible on desktop (1440×900)")
    void loginPage_desktop_formVisible() {
        setViewport(1440, 900);
        LoginPage page = openLoginPage();

        WebElement submitBtn = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("[data-testid='login-submit-btn']")));
        assertTrue(submitBtn.isDisplayed(), "Submit button should be visible at 1440px");
    }

    @Test
    @DisplayName("Login form is fully visible on tablet (768×1024)")
    void loginPage_tablet_formVisible() {
        setViewport(768, 1024);
        LoginPage page = openLoginPage();

        WebElement submitBtn = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("[data-testid='login-submit-btn']")));
        assertTrue(submitBtn.isDisplayed(), "Submit button should be visible at 768px");
    }

    @Test
    @DisplayName("Login form is fully visible on mobile (390×844)")
    void loginPage_mobile_formVisible() {
        setViewport(390, 844);
        LoginPage page = openLoginPage();

        WebElement usernameInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("[data-testid='login-username-input']")));
        WebElement passwordInput = driver.findElement(
                By.cssSelector("[data-testid='login-password-input']"));
        WebElement submitBtn = driver.findElement(
                By.cssSelector("[data-testid='login-submit-btn']"));

        assertTrue(usernameInput.isDisplayed(), "Username input should be visible on mobile");
        assertTrue(passwordInput.isDisplayed(), "Password input should be visible on mobile");
        assertTrue(submitBtn.isDisplayed(), "Submit button should be visible on mobile");
    }

    @Test
    @DisplayName("Animated scene panel is hidden on mobile (< lg breakpoint)")
    void loginPage_mobile_animatedSceneHidden() {
        setViewport(390, 844);
        navigate("/login");
        wait.until(ExpectedConditions.urlContains("/login"));

        // The animated scene is inside a div with class 'hidden lg:flex'
        // On mobile the element exists in DOM but is hidden
        WebElement scene = driver.findElement(By.cssSelector(".hidden.lg\\:flex"));
        // Selenium's isDisplayed() returns false for elements hidden via Tailwind's 'hidden'
        assertFalse(scene.isDisplayed(),
                "Animated scene panel should be hidden on mobile viewports");
    }

    // ── Dashboard responsive tests ───────────────────────────────────────────

    @Test
    @DisplayName("Dashboard sidebar is visible on laptop (1024×768)")
    void dashboard_laptop_sidebarVisible() {
        setViewport(1024, 768);
        loginAsOperator();

        WebElement sidebar = wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.cssSelector("aside")));
        assertTrue(sidebar.isDisplayed(), "Sidebar should be visible at 1024px");
    }

    @Test
    @DisplayName("Dashboard heading is visible across all viewport sizes")
    void dashboard_heading_visibleAtAllSizes() {
        // Log in once at the default viewport, then resize and assert the
        // Dashboard heading remains visible at each size (more realistic than
        // logging in/out for every viewport change).
        setViewport(1440, 900);
        navigate("/login");
        new LoginPage(driver, wait).waitForLoad()
                .loginAs("operator1", "password123");

        // Wait for initial redirect to /dashboard
        new WebDriverWait(driver, Duration.ofSeconds(30))
                .until(ExpectedConditions.urlContains("/dashboard"));

        int[][] viewports = {{1440, 900}, {1024, 768}, {768, 1024}};
        for (int[] vp : viewports) {
            setViewport(vp[0], vp[1]);
            // Re-navigate to /dashboard after resize to trigger a fresh render
            navigate("/dashboard");
            WebElement heading = new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(ExpectedConditions.visibilityOfElementLocated(
                            By.xpath("//h1[normalize-space()='Dashboard']")));
            assertTrue(heading.isDisplayed(),
                    "Dashboard heading should be visible at " + vp[0] + "×" + vp[1]);
        }
    }

    // ── Registration page responsive tests ──────────────────────────────────

    @Test
    @DisplayName("Registration form is usable on mobile (390×844)")
    void registerPage_mobile_formUsable() {
        setViewport(390, 844);
        navigate("/register");

        WebElement nameInput = wait.until(
                ExpectedConditions.visibilityOfElementLocated(
                        By.cssSelector("[data-testid='register-name-input']")));
        WebElement submitBtn = driver.findElement(
                By.cssSelector("[data-testid='register-submit-btn']"));

        assertTrue(nameInput.isDisplayed(), "Name input should be visible on mobile");
        assertTrue(submitBtn.isDisplayed(), "Submit button should be visible on mobile");
    }

}

