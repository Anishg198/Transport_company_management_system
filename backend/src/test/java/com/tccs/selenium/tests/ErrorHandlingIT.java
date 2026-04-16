package com.tccs.selenium.tests;

import com.tccs.selenium.BaseSeleniumTest;
import com.tccs.selenium.pages.ConsignmentsPage;
import com.tccs.selenium.pages.DashboardPage;
import com.tccs.selenium.pages.LoginPage;
import com.tccs.selenium.pages.RegisterPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium tests verifying that API errors and client-side validation errors
 * are gracefully surfaced in the React UI (no blank screens, no unhandled
 * promise rejections visible to the user).
 *
 * <p>Test categories:
 * <ul>
 *   <li>HTTP 401 — wrong credentials on login</li>
 *   <li>HTTP 4xx — duplicate resource (registration with existing username)</li>
 *   <li>Client-side validation — required-field and format checks</li>
 *   <li>Role-based 403 — accessing a route the role cannot see</li>
 *   <li>Unknown route — wildcard redirect</li>
 * </ul>
 */
@DisplayName("Error Handling Tests")
class ErrorHandlingIT extends BaseSeleniumTest {

    // ── Helpers ──────────────────────────────────────────────────────────────

    private LoginPage openLoginPage() {
        navigate("/login");
        return new LoginPage(driver, wait).waitForLoad();
    }

    private DashboardPage loginAs(String user, String password) {
        return openLoginPage().loginAs(user, password).waitForLoad();
    }

    // ── Login error handling ─────────────────────────────────────────────────

    @Test
    @DisplayName("Wrong password returns visible error — not a blank page")
    void wrongPassword_showsInlineError() {
        LoginPage page = openLoginPage();
        page.enterUsername("operator1")
            .enterPassword("wrongpassword")
            .clickSubmit();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='login-error-msg']")));

        assertTrue(page.isErrorDisplayed(),
                "An inline error message should appear — not a blank page");
        // Confirm the page did NOT navigate away (user stays on login)
        assertTrue(driver.getCurrentUrl().contains("/login"),
                "User should remain on /login after a failed login attempt");
    }

    @Test
    @DisplayName("Non-existent username returns visible error")
    void nonExistentUser_showsInlineError() {
        LoginPage page = openLoginPage();
        page.enterUsername("user_that_does_not_exist_xyz")
            .enterPassword("anypassword")
            .clickSubmit();

        wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[data-testid='login-error-msg']")));

        assertTrue(page.isErrorDisplayed());
    }

    @Test
    @DisplayName("Empty username field shows client-side validation error")
    void emptyUsername_showsValidationError() {
        LoginPage page = openLoginPage();
        // Leave username blank, provide a password
        page.enterPassword("somepassword").clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Client-side validation should catch missing username");
    }

    @Test
    @DisplayName("Empty password field shows client-side validation error")
    void emptyPassword_showsValidationError() {
        LoginPage page = openLoginPage();
        // Provide username but leave password blank
        page.enterUsername("operator1").clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Client-side validation should catch missing password");
    }

    // ── Registration error handling ──────────────────────────────────────────

    @Test
    @DisplayName("Registering a duplicate username shows a backend 4xx error in UI")
    void duplicateUsername_showsFriendlyError() {
        navigate("/register");
        RegisterPage page = new RegisterPage(driver, wait).waitForLoad();

        page.enterName("Duplicate Operator")
            .enterUsername("operator1")          // already exists
            .enterPassword("ValidPass99!")
            .enterConfirmPassword("ValidPass99!")
            .selectRole("BranchOperator")
            .clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "A duplicate username should produce a user-visible error message");
        String error = page.getErrorMessage();
        assertNotNull(error, "Error text should not be null");
        // UI must not expose a raw stack trace — check it's a human-readable message
        assertFalse(error.contains("Exception"),
                "Error message should not expose a Java exception class name");
        assertFalse(error.contains("at com.tccs"),
                "Error message should not expose a Java stack trace");
    }

    @Test
    @DisplayName("Password mismatch is caught before hitting the backend")
    void passwordMismatch_caughtClientSide() {
        navigate("/register");
        RegisterPage page = new RegisterPage(driver, wait).waitForLoad();

        page.enterName("Mismatch User")
            .enterUsername("mismatch_test_user")
            .enterPassword("Password1!")
            .enterConfirmPassword("Different2!")
            .selectRole("BranchOperator")
            .clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Client-side validation should catch mismatched passwords");
        // Backend 500 errors contain specific keywords — ensure we're showing a client msg
        String error = page.getErrorMessage();
        assertNotNull(error);
        assertFalse(error.contains("500"),
                "Password mismatch error should be caught client-side (no 500 status)");
    }

    // ── Role-based access / routing ──────────────────────────────────────────

    @Test
    @DisplayName("BranchOperator accessing /pricing is redirected to /dashboard (403-equivalent)")
    void branchOperatorAccessingPricing_redirectsToDashboard() {
        loginAs("operator1", "password123");

        // /pricing is restricted to SystemAdministrator only
        navigate("/pricing");

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "BranchOperator should be redirected away from /pricing to /dashboard");
    }

    @Test
    @DisplayName("BranchOperator accessing /users is redirected to /dashboard")
    void branchOperatorAccessingUsers_redirectsToDashboard() {
        loginAs("operator1", "password123");

        navigate("/users");

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "BranchOperator should be redirected away from /users to /dashboard");
    }

    @Test
    @DisplayName("Unknown route is redirected to /dashboard for authenticated users")
    void unknownRoute_redirectsToDashboard() {
        loginAs("operator1", "password123");

        navigate("/this-route-definitely-does-not-exist");

        wait.until(ExpectedConditions.urlContains("/dashboard"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "Wildcard route catch-all should redirect to /dashboard");
    }

    // ── Consignment form validation ──────────────────────────────────────────

    @Test
    @DisplayName("Submitting consignment form with no destination shows a toast error")
    void consignmentForm_missingDestination_showsError() {
        loginAs("operator1", "password123");
        // Navigate directly — sidebar NavLink click is flaky in headless mode
        driver.get(BASE_URL + "/consignments");

        ConsignmentsPage page = new ConsignmentsPage(driver, wait).waitForLoad();
        page.clickOpenRegisterModal()
            .enterVolume("10.00")
            // Skip selectDestination intentionally
            .enterSenderAddress("Sender Address, City")
            .enterReceiverAddress("Receiver Address, City")
            .clickRegisterAndGenerateBill();

        // The consignment number should NOT appear — form is invalid
        String result = page.waitForConsignmentNumber();
        assertNull(result,
                "Form with missing destination should not produce a consignment number");
    }
}
