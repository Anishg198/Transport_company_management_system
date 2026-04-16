package com.tccs.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Page Object for the Login page ({@code /login}).
 *
 * <p>All selectors use {@code data-testid} attributes added to the JSX so that
 * tests remain stable against styling and layout changes.
 */
public class LoginPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // ── Selectors ────────────────────────────────────────────────────────────
    private static final By USERNAME_INPUT    = By.cssSelector("[data-testid='login-username-input']");
    private static final By PASSWORD_INPUT    = By.cssSelector("[data-testid='login-password-input']");
    private static final By SUBMIT_BTN        = By.cssSelector("[data-testid='login-submit-btn']");
    private static final By ERROR_MSG         = By.cssSelector("[data-testid='login-error-msg']");
    private static final By REGISTER_LINK     = By.cssSelector("[data-testid='login-register-link']");

    public LoginPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    /** Wait for the username field to be visible — confirms the page has loaded. */
    public LoginPage waitForLoad() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(USERNAME_INPUT));
        return this;
    }

    public LoginPage enterUsername(String username) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(USERNAME_INPUT));
        el.clear();
        el.sendKeys(username);
        return this;
    }

    public LoginPage enterPassword(String password) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(PASSWORD_INPUT));
        el.clear();
        el.sendKeys(password);
        return this;
    }

    /** Submits the form and returns this page (for checking errors) or use
     *  {@link #loginAs(String, String)} which returns a DashboardPage. */
    public LoginPage clickSubmit() {
        WebElement btn = wait.until(ExpectedConditions.presenceOfElementLocated(SUBMIT_BTN));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        return this;
    }

    /**
     * Full login flow. Returns a {@link DashboardPage} on success.
     * The caller should call {@link DashboardPage#waitForLoad()} to verify
     * the redirect completed.
     */
    public DashboardPage loginAs(String username, String password) {
        enterUsername(username);
        enterPassword(password);
        clickSubmit();
        return new DashboardPage(driver, wait);
    }

    /** Returns the visible error message text, or {@code null} if absent. */
    public String getErrorMessage() {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(3))
                    .until(ExpectedConditions.visibilityOfElementLocated(ERROR_MSG));
            return el.getText();
        } catch (Exception e) {
            return null;
        }
    }

    public boolean isErrorDisplayed() {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(ERROR_MSG));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public void clickRegisterLink() {
        wait.until(ExpectedConditions.elementToBeClickable(REGISTER_LINK)).click();
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }
}
