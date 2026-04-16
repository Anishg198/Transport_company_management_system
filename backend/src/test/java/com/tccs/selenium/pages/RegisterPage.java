package com.tccs.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Page Object for the Registration page ({@code /register}).
 */
public class RegisterPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    private static final By NAME_INPUT            = By.cssSelector("[data-testid='register-name-input']");
    private static final By USERNAME_INPUT        = By.cssSelector("[data-testid='register-username-input']");
    private static final By PASSWORD_INPUT        = By.cssSelector("[data-testid='register-password-input']");
    private static final By CONFIRM_PASSWORD_INPUT = By.cssSelector("[data-testid='register-confirm-password-input']");
    private static final By ROLE_SELECT           = By.cssSelector("[data-testid='register-role-select']");
    private static final By SUBMIT_BTN            = By.cssSelector("[data-testid='register-submit-btn']");
    private static final By ERROR_MSG             = By.cssSelector("[data-testid='register-error-msg']");
    private static final By SUCCESS_HEADING       = By.cssSelector("[data-testid='register-success-heading']");
    private static final By SIGNIN_LINK           = By.xpath("//a[normalize-space()='Sign In']");

    public RegisterPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public RegisterPage waitForLoad() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(NAME_INPUT));
        return this;
    }

    public RegisterPage enterName(String name) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(NAME_INPUT));
        el.clear();
        el.sendKeys(name);
        return this;
    }

    public RegisterPage enterUsername(String username) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(USERNAME_INPUT));
        el.clear();
        el.sendKeys(username);
        return this;
    }

    public RegisterPage enterPassword(String password) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(PASSWORD_INPUT));
        el.clear();
        el.sendKeys(password);
        return this;
    }

    public RegisterPage enterConfirmPassword(String password) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(CONFIRM_PASSWORD_INPUT));
        el.clear();
        el.sendKeys(password);
        return this;
    }

    public RegisterPage selectRole(String roleValue) {
        WebElement el = wait.until(ExpectedConditions.elementToBeClickable(ROLE_SELECT));
        new Select(el).selectByValue(roleValue);
        return this;
    }

    public RegisterPage clickSubmit() {
        WebElement btn = wait.until(ExpectedConditions.presenceOfElementLocated(SUBMIT_BTN));
        // JS click bypasses any overlay/scroll-container interception issues
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        return this;
    }

    /** Returns true when the success confirmation heading appears. */
    public boolean waitForSuccessHeading() {
        try {
            wait.until(ExpectedConditions.visibilityOfElementLocated(SUCCESS_HEADING));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

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
            // Wait up to 5 s — async API errors take time to surface in the UI
            new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(ERROR_MSG));
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public LoginPage clickSignInLink() {
        WebElement link = wait.until(ExpectedConditions.presenceOfElementLocated(SIGNIN_LINK));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", link);
        return new LoginPage(driver, wait);
    }
}
