package com.tccs.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Keys;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;
import java.util.List;

/**
 * Page Object for the Chat page ({@code /chat}).
 */
public class ChatPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // ── Selectors ─────────────────────────────────────────────────────────────
    private static final By PAGE_HEADING      = By.xpath("//h1[normalize-space()='Chat']");
    private static final By USER_LIST         = By.cssSelector("[data-testid='chat-user-list']");
    private static final By SEARCH_INPUT      = By.cssSelector("[data-testid='chat-search-input']");
    private static final By EMPTY_STATE       = By.cssSelector("[data-testid='chat-empty-state']");
    private static final By CONVERSATION_EMPTY= By.cssSelector("[data-testid='chat-conversation-empty']");
    private static final By MESSAGE_INPUT     = By.cssSelector("[data-testid='chat-message-input']");
    private static final By SEND_BTN          = By.cssSelector("[data-testid='chat-send-btn']");
    private static final By CONSIGNMENT_INPUT = By.cssSelector("[data-testid='chat-consignment-ref-input']");
    private static final By OWN_MESSAGES      = By.cssSelector("[data-testid='chat-msg-own']");
    private static final By NO_USERS          = By.cssSelector("[data-testid='chat-no-users']");

    public ChatPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public ChatPage waitForLoad() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(PAGE_HEADING));
        wait.until(ExpectedConditions.visibilityOfElementLocated(USER_LIST));
        return this;
    }

    // ── User list ─────────────────────────────────────────────────────────────

    /** Returns all user-item buttons currently visible in the list. */
    public List<WebElement> getUserItems() {
        return driver.findElements(By.cssSelector("[data-testid^='chat-user-']"));
    }

    /** Clicks the user-item for the given username. */
    public ChatPage selectUser(String username) {
        By locator = By.cssSelector("[data-testid='chat-user-" + username + "']");
        WebElement btn = wait.until(ExpectedConditions.elementToBeClickable(locator));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        return this;
    }

    /** Types into the people-search box via React's internal onChange handler. */
    public ChatPage searchUsers(String query) {
        WebElement el = wait.until(ExpectedConditions.presenceOfElementLocated(SEARCH_INPUT));
        setReactValue(el, query);
        return this;
    }

    public boolean isEmptyStateVisible() {
        try {
            return driver.findElement(EMPTY_STATE).isDisplayed();
        } catch (Exception e) { return false; }
    }

    public boolean isNoUsersVisible() {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(3))
                    .until(ExpectedConditions.visibilityOfElementLocated(NO_USERS))
                    .isDisplayed();
        } catch (Exception e) { return false; }
    }

    // ── Conversation ──────────────────────────────────────────────────────────

    /** Waits for the conversation panel to open (message input becomes visible). */
    public ChatPage waitForConversationOpen() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(MESSAGE_INPUT));
        return this;
    }

    public boolean isConversationEmptyStateVisible() {
        try {
            return new WebDriverWait(driver, Duration.ofSeconds(5))
                    .until(ExpectedConditions.visibilityOfElementLocated(CONVERSATION_EMPTY))
                    .isDisplayed();
        } catch (Exception e) { return false; }
    }

    /** Returns whether the Send button is currently disabled. */
    public boolean isSendButtonDisabled() {
        try {
            WebElement btn = driver.findElement(SEND_BTN);
            String disabled = btn.getAttribute("disabled");
            return disabled != null;
        } catch (Exception e) { return false; }
    }

    /** Types a message into the message textarea. */
    public ChatPage typeMessage(String text) {
        setReactValue(wait.until(ExpectedConditions.presenceOfElementLocated(MESSAGE_INPUT)), text);
        return this;
    }

    /** Types a consignment reference into the optional ref field. */
    public ChatPage typeConsignmentRef(String ref) {
        setReactValue(wait.until(ExpectedConditions.presenceOfElementLocated(CONSIGNMENT_INPUT)), ref);
        return this;
    }

    /** Clicks the Send button. */
    public ChatPage clickSend() {
        WebElement btn = wait.until(ExpectedConditions.presenceOfElementLocated(SEND_BTN));
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        return this;
    }

    /** Types a message then presses Enter to send (keyboard shortcut). */
    public ChatPage typeAndPressEnter(String text) {
        typeMessage(text);
        // Give React a moment to commit the state update
        try { Thread.sleep(300); } catch (InterruptedException ignored) {}
        // Dispatch a synthetic Enter keydown event — React's onKeyDown handler listens for this
        WebElement el = driver.findElement(MESSAGE_INPUT);
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].dispatchEvent(" +
                "  new KeyboardEvent('keydown', {key:'Enter', keyCode:13, bubbles:true, cancelable:true})" +
                ");",
                el);
        return this;
    }

    /**
     * Waits until at least {@code minCount} own-message bubbles are visible.
     */
    public boolean waitForOwnMessageCount(int minCount) {
        try {
            new WebDriverWait(driver, Duration.ofSeconds(8)).until(
                    d -> d.findElements(OWN_MESSAGES).size() >= minCount);
            return true;
        } catch (Exception e) { return false; }
    }

    public int getOwnMessageCount() {
        return driver.findElements(OWN_MESSAGES).size();
    }

    /** Returns the text content of the last own-message bubble. */
    public String getLastOwnMessageText() {
        List<WebElement> msgs = driver.findElements(OWN_MESSAGES);
        if (msgs.isEmpty()) return null;
        WebElement last = msgs.get(msgs.size() - 1);
        // The text is inside a <p> inside the bubble
        try {
            return last.findElement(By.tagName("p")).getText();
        } catch (Exception e) {
            return last.getText();
        }
    }

    // ── Shared React helper ───────────────────────────────────────────────────

    /** Sets a React-controlled input/textarea value via __reactProps.onChange. */
    private void setReactValue(WebElement el, String value) {
        ((JavascriptExecutor) driver).executeScript(
                "var el = arguments[0], val = arguments[1];" +
                "var key = Object.keys(el).find(function(k){ return k.startsWith('__reactProps'); });" +
                "if (key && el[key].onChange) {" +
                "  var proto = Object.getPrototypeOf(el);" +
                "  var nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set;" +
                "  nativeSetter.call(el, val);" +
                "  el[key].onChange({ target: el });" +
                "}",
                el, value);
    }

    /** Checks if the unread badge dot is visible on the Chat nav link in the sidebar. */
    public boolean isChatNavBadgeVisible() {
        try {
            // The Chat nav link has a red badge span when unreadTotal > 0
            WebElement navChat = driver.findElement(By.cssSelector("[data-testid='nav-chat']"));
            return !navChat.findElements(By.cssSelector("span.bg-red-500")).isEmpty();
        } catch (Exception e) { return false; }
    }
}
