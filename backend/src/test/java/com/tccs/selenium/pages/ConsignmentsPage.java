package com.tccs.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Page Object for the Consignments list page ({@code /consignments}).
 *
 * <p>Also encapsulates the "Register New Consignment" modal form which is
 * rendered inside this page.
 */
public class ConsignmentsPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // ── List page selectors ──────────────────────────────────────────────────
    private static final By PAGE_HEADING      = By.xpath("//h1[normalize-space()='Consignments']");
    private static final By OPEN_MODAL_BTN    = By.cssSelector("[data-testid='open-register-modal-btn']");
    private static final By SEARCH_INPUT      = By.cssSelector("[data-testid='consignment-search-input']");
    private static final By TABLE_ROWS        = By.cssSelector("tbody tr");
    private static final By EMPTY_STATE       = By.xpath("//td[contains(.,'No consignments found')]");

    // ── Modal / form selectors ───────────────────────────────────────────────
    private static final By VOLUME_INPUT      = By.cssSelector("[data-testid='consignment-volume-input']");
    private static final By DESTINATION_SELECT = By.cssSelector("[data-testid='consignment-destination-select']");
    private static final By SENDER_INPUT      = By.cssSelector("[data-testid='consignment-sender-input']");
    private static final By RECEIVER_INPUT    = By.cssSelector("[data-testid='consignment-receiver-input']");
    private static final By SUBMIT_BTN        = By.cssSelector("[data-testid='consignment-submit-btn']");
    private static final By CONSIGNMENT_NUM   = By.cssSelector("[data-testid='consignment-number-result']");

    public ConsignmentsPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public ConsignmentsPage waitForLoad() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(PAGE_HEADING));
        return this;
    }

    public boolean isLoaded() {
        try {
            return driver.findElement(PAGE_HEADING).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    // ── List page actions ────────────────────────────────────────────────────

    public ConsignmentsPage clickOpenRegisterModal() {
        WebElement btn = wait.until(ExpectedConditions.presenceOfElementLocated(OPEN_MODAL_BTN));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        // Wait for modal content (the volume input) to appear
        wait.until(ExpectedConditions.visibilityOfElementLocated(VOLUME_INPUT));
        return this;
    }

    /**
     * Waits for the async table load to complete (loading skeleton disappears,
     * real {@code <tbody>} appears) before interacting with table rows.
     */
    public ConsignmentsPage waitForTableBody() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector("tbody")));
        return this;
    }

    /** Returns all visible data rows in the consignments table (excludes empty-state row). */
    public List<WebElement> getTableRows() {
        return driver.findElements(TABLE_ROWS);
    }

    /** Types into the search filter using React's internal onChange handler. */
    public ConsignmentsPage search(String query) {
        WebElement el = wait.until(ExpectedConditions.presenceOfElementLocated(SEARCH_INPUT));
        setReactInputValue(el, query);
        return this;
    }

    // ── React-compatible value setters ───────────────────────────────────────

    /**
     * Sets the value of a React-controlled {@code <input>} or {@code <textarea>}
     * by invoking the element's {@code __reactProps} onChange handler directly.
     * This bypasses DOM event dispatching entirely and updates React state reliably,
     * even inside modals and nested components where event bubbling may be unreliable.
     */
    private void setReactInputValue(WebElement el, String value) {
        ((JavascriptExecutor) driver).executeScript(
                "var el = arguments[0], val = arguments[1];" +
                "var key = Object.keys(el).find(function(k){ return k.startsWith('__reactProps'); });" +
                "if (key && el[key].onChange) {" +
                "  var nativeSetter = Object.getOwnPropertyDescriptor(" +
                "    Object.getPrototypeOf(el), 'value').set;" +
                "  nativeSetter.call(el, val);" +
                "  el[key].onChange({ target: el });" +
                "}",
                el, value);
    }

    /**
     * Sets the value of a React-controlled {@code <select>} by directly invoking
     * its {@code __reactProps} onChange handler.
     */
    private void setReactSelectValue(WebElement el, String value) {
        ((JavascriptExecutor) driver).executeScript(
                "var el = arguments[0], val = arguments[1];" +
                "var key = Object.keys(el).find(function(k){ return k.startsWith('__reactProps'); });" +
                "if (key && el[key].onChange) {" +
                "  el.value = val;" +
                "  el[key].onChange({ target: el });" +
                "}",
                el, value);
    }

    /** Waits until the "No consignments found" empty-state row is visible. */
    public ConsignmentsPage waitForEmptyState() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(EMPTY_STATE));
        return this;
    }

    // ── Register modal actions ───────────────────────────────────────────────

    public ConsignmentsPage enterVolume(String volume) {
        WebElement el = wait.until(ExpectedConditions.presenceOfElementLocated(VOLUME_INPUT));
        setReactInputValue(el, volume);
        return this;
    }

    public ConsignmentsPage selectDestination(String destination) {
        WebElement el = wait.until(ExpectedConditions.presenceOfElementLocated(DESTINATION_SELECT));
        setReactSelectValue(el, destination);
        return this;
    }

    public ConsignmentsPage enterSenderAddress(String address) {
        WebElement el = wait.until(ExpectedConditions.presenceOfElementLocated(SENDER_INPUT));
        setReactInputValue(el, address);
        return this;
    }

    public ConsignmentsPage enterReceiverAddress(String address) {
        WebElement el = wait.until(ExpectedConditions.presenceOfElementLocated(RECEIVER_INPUT));
        setReactInputValue(el, address);
        return this;
    }

    public ConsignmentsPage clickRegisterAndGenerateBill() {
        // Brief pause to let React flush all pending form state updates before submit
        try { Thread.sleep(400); } catch (InterruptedException ignored) {}
        WebElement btn = wait.until(ExpectedConditions.presenceOfElementLocated(SUBMIT_BTN));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        return this;
    }

    /**
     * Waits up to the default timeout for the success result (consignment number)
     * to appear after form submission.
     *
     * @return the generated consignment number string, or {@code null} if it
     *         never appeared.
     */
    public String waitForConsignmentNumber() {
        try {
            WebElement el = new WebDriverWait(driver, Duration.ofSeconds(15))
                    .until(ExpectedConditions.visibilityOfElementLocated(CONSIGNMENT_NUM));
            return el.getText();
        } catch (Exception e) {
            return null;
        }
    }
}
