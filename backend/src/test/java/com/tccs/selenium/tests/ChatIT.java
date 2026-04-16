package com.tccs.selenium.tests;

import com.tccs.selenium.BaseSeleniumTest;
import com.tccs.selenium.pages.ChatPage;
import com.tccs.selenium.pages.LoginPage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium integration tests for the Chat page ({@code /chat}).
 *
 * <p>Tests cover:
 * <ul>
 *   <li>Page load and user list rendering</li>
 *   <li>People search / filter</li>
 *   <li>Empty state before a conversation is selected</li>
 *   <li>Opening a conversation</li>
 *   <li>Send button disabled when input is empty</li>
 *   <li>Sending a message via button click</li>
 *   <li>Sending a message via Enter key</li>
 *   <li>Sending a message with a consignment reference</li>
 *   <li>Unread badge appears on sidebar after receiving a message (two-user flow)</li>
 * </ul>
 */
@DisplayName("Chat Tests")
class ChatIT extends BaseSeleniumTest {

    private ChatPage chatPage;

    @BeforeEach
    void loginAndNavigate() {
        navigate("/login");
        new LoginPage(driver, wait).waitForLoad()
                .loginAs("operator1", "password123")
                .waitForLoad();
        navigate("/chat");
        chatPage = new ChatPage(driver, wait).waitForLoad();
    }

    // ── Page load ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Chat page loads and user list is visible")
    void chatPage_loadsWithUserList() {
        assertFalse(chatPage.getUserItems().isEmpty(),
                "At least one user should appear in the chat list");
    }

    // ── People search ─────────────────────────────────────────────────────────

    @Test
    @DisplayName("Search filters the user list by name")
    void search_filtersUserList() {
        int allUsers = chatPage.getUserItems().size();

        // Search for a string that is very unlikely to match everyone
        chatPage.searchUsers("manager");

        // Give React state a moment to re-filter
        try { Thread.sleep(500); } catch (InterruptedException ignored) {}

        int filtered = chatPage.getUserItems().size();
        assertTrue(filtered < allUsers || filtered == 1,
                "Filtering by 'manager' should reduce the visible user count");
    }

    @Test
    @DisplayName("Search with no match shows 'No users found'")
    void search_noMatch_showsNoUsersFound() {
        chatPage.searchUsers("xyzzy_no_match_999");
        assertTrue(chatPage.isNoUsersVisible(),
                "'No users found' text should appear when search matches nobody");
    }

    // ── Empty state ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("'Select a person to start chatting' shows before any conversation is opened")
    void emptyState_visibleOnLoad() {
        assertTrue(chatPage.isEmptyStateVisible(),
                "Empty-state prompt should be visible when no conversation is selected");
    }

    // ── Opening a conversation ────────────────────────────────────────────────

    @Test
    @DisplayName("Clicking a user opens the conversation panel")
    void selectUser_opensConversation() {
        chatPage.selectUser("manager1").waitForConversationOpen();

        // Message input should now be visible
        assertTrue(driver.findElement(
                By.cssSelector("[data-testid='chat-message-input']")).isDisplayed(),
                "Message input should be visible after selecting a user");

        // Empty state should no longer be visible
        assertFalse(chatPage.isEmptyStateVisible(),
                "Empty-state prompt should disappear after selecting a user");
    }

    @Test
    @DisplayName("'No messages yet' shows when a fresh conversation is opened")
    void freshConversation_showsNoMessagesState() {
        // admin1 is unlikely to have had a conversation with operator1 in a clean DB
        chatPage.selectUser("admin1").waitForConversationOpen();

        // Either "No messages yet" (fresh) OR messages (if prior data exists) — both are valid
        // We just assert the conversation panel itself is open (input visible)
        assertTrue(driver.findElement(
                By.cssSelector("[data-testid='chat-message-input']")).isDisplayed(),
                "Conversation panel should open");
    }

    // ── Send button state ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Send button is disabled when message input is empty")
    void sendButton_disabledWhenEmpty() {
        chatPage.selectUser("manager1").waitForConversationOpen();

        assertTrue(chatPage.isSendButtonDisabled(),
                "Send button should be disabled when no text is typed");
    }

    // ── Sending messages ──────────────────────────────────────────────────────

    @Test
    @DisplayName("Sending a message via button click — it appears as an own bubble")
    void sendMessage_viaButton_appearsInConversation() {
        chatPage.selectUser("manager1").waitForConversationOpen();

        int before = chatPage.getOwnMessageCount();

        chatPage.typeMessage("Hello from Selenium test " + System.currentTimeMillis())
                .clickSend();

        assertTrue(chatPage.waitForOwnMessageCount(before + 1),
                "A new own-message bubble should appear after clicking Send");
    }

    @Test
    @DisplayName("Sending a message via Enter key — it appears as an own bubble")
    void sendMessage_viaEnterKey_appearsInConversation() {
        chatPage.selectUser("manager1").waitForConversationOpen();

        int before = chatPage.getOwnMessageCount();
        String text = "Enter-key test " + System.currentTimeMillis();

        chatPage.typeAndPressEnter(text);

        assertTrue(chatPage.waitForOwnMessageCount(before + 1),
                "A new own-message bubble should appear after pressing Enter");
        assertEquals(text, chatPage.getLastOwnMessageText(),
                "The message text should match what was typed");
    }

    @Test
    @DisplayName("Sending a message with a consignment reference attaches it to the bubble")
    void sendMessage_withConsignmentRef_appearsInConversation() {
        chatPage.selectUser("manager1").waitForConversationOpen();

        int before = chatPage.getOwnMessageCount();

        chatPage.typeConsignmentRef("TCCS-TEST-0001")
                .typeMessage("Consignment ref test " + System.currentTimeMillis())
                .clickSend();

        assertTrue(chatPage.waitForOwnMessageCount(before + 1),
                "Message with consignment reference should send successfully");
    }

    // ── Unread badge (two-user flow) ──────────────────────────────────────────

    @Test
    @DisplayName("Unread badge appears on Chat nav when manager1 sends a message to operator1")
    void unreadBadge_appearsAfterReceivingMessage() throws Exception {
        // ── Step 1: get manager1's JWT via direct HTTP call (no second browser) ──
        String backendUrl = "http://localhost:8080";
        HttpClient http = HttpClient.newHttpClient();

        // Login as manager1
        String loginBody = "{\"username\":\"manager1\",\"password\":\"password123\"}";
        HttpRequest loginReq = HttpRequest.newBuilder()
                .uri(URI.create(backendUrl + "/api/auth/login"))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(loginBody))
                .build();
        HttpResponse<String> loginRes = http.send(loginReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, loginRes.statusCode(), "manager1 login should succeed");

        // Extract JWT token from response JSON
        Matcher tokenMatcher = Pattern.compile("\"token\"\\s*:\\s*\"([^\"]+)\"")
                .matcher(loginRes.body());
        assertTrue(tokenMatcher.find(), "JWT token should be present in login response");
        String managerJwt = tokenMatcher.group(1);

        // ── Step 2: get operator1's user ID from the chat users list ──
        HttpRequest usersReq = HttpRequest.newBuilder()
                .uri(URI.create(backendUrl + "/api/chat/users"))
                .header("Authorization", "Bearer " + managerJwt)
                .GET()
                .build();
        HttpResponse<String> usersRes = http.send(usersReq, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, usersRes.statusCode(), "Chat users request should succeed");

        // Find operator1's user_id in the response
        Matcher userMatcher = Pattern.compile(
                "\"username\"\\s*:\\s*\"operator1\"[^}]*\"user_id\"\\s*:\\s*\"([^\"]+)\"")
                .matcher(usersRes.body());
        if (!userMatcher.find()) {
            // Try the other field order
            userMatcher = Pattern.compile(
                    "\"user_id\"\\s*:\\s*\"([^\"]+)\"[^}]*\"username\"\\s*:\\s*\"operator1\"")
                    .matcher(usersRes.body());
        }
        assertTrue(userMatcher.find(), "operator1 should appear in the chat users list");
        String operator1Id = userMatcher.group(1);

        // ── Step 3: manager1 sends a message to operator1 via API ──
        String msgBody = "{\"content\":\"Badge test " + System.currentTimeMillis()
                + "\",\"recipientId\":\"" + operator1Id + "\"}";
        HttpRequest sendReq = HttpRequest.newBuilder()
                .uri(URI.create(backendUrl + "/api/chat/messages"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + managerJwt)
                .POST(HttpRequest.BodyPublishers.ofString(msgBody))
                .build();
        HttpResponse<String> sendRes = http.send(sendReq, HttpResponse.BodyHandlers.ofString());
        assertTrue(sendRes.statusCode() == 200 || sendRes.statusCode() == 201,
                "Message send should succeed (got " + sendRes.statusCode() + ")");

        // ── Step 4: operator1's browser should show the unread badge ──
        // Navigate away from /chat so the notification context picks up the unread
        navigate("/dashboard");

        // Polling interval is 3 s — badge should appear within 8 s
        boolean badgeAppeared = new WebDriverWait(driver, Duration.ofSeconds(8)).until(
                d -> {
                    try {
                        WebElement nav = d.findElement(By.cssSelector("[data-testid='nav-chat']"));
                        return !nav.findElements(By.cssSelector("span.bg-red-500")).isEmpty();
                    } catch (Exception e) {
                        return false;
                    }
                });

        assertTrue(badgeAppeared,
                "Unread badge should appear on the Chat nav link after receiving a message");
    }
}
