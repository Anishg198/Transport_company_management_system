package com.tccs.selenium.tests;

import com.tccs.selenium.BaseSeleniumTest;
import com.tccs.selenium.pages.DashboardPage;
import com.tccs.selenium.pages.LoginPage;
import com.tccs.selenium.pages.SidebarComponent;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.support.ui.ExpectedConditions;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium integration tests covering User Authentication flows:
 * <ul>
 *   <li>Successful login for each demo role</li>
 *   <li>Invalid-credentials error display</li>
 *   <li>Empty-field validation</li>
 *   <li>Logout flow</li>
 *   <li>Session persistence (already-authenticated redirect)</li>
 *   <li>Unauthenticated redirect to login</li>
 * </ul>
 *
 * <p>Prerequisites: backend running on port 8080, frontend on port 5173.
 */
@DisplayName("Authentication Tests")
class AuthenticationIT extends BaseSeleniumTest {

    // ── Helpers ──────────────────────────────────────────────────────────────

    private LoginPage openLoginPage() {
        navigate("/login");
        return new LoginPage(driver, wait).waitForLoad();
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Successful login as BranchOperator redirects to /dashboard")
    void loginAsBranchOperator_redirectsToDashboard() {
        LoginPage loginPage = openLoginPage();

        DashboardPage dashboard = loginPage.loginAs("operator1", "password123");
        dashboard.waitForLoad();

        assertTrue(dashboard.isLoaded(), "Dashboard heading should be visible after login");
        assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "URL should contain /dashboard after successful login");
    }

    @Test
    @DisplayName("Successful login as TransportManager")
    void loginAsTransportManager_redirectsToDashboard() {
        LoginPage loginPage = openLoginPage();

        DashboardPage dashboard = loginPage.loginAs("manager1", "password123");
        dashboard.waitForLoad();

        assertTrue(dashboard.isLoaded());
    }

    @Test
    @DisplayName("Successful login as SystemAdmin")
    void loginAsSystemAdmin_redirectsToDashboard() {
        LoginPage loginPage = openLoginPage();

        DashboardPage dashboard = loginPage.loginAs("admin1", "admin123");
        dashboard.waitForLoad();

        assertTrue(dashboard.isLoaded());
    }

    @Test
    @DisplayName("Invalid credentials show error message")
    void invalidCredentials_showsErrorMessage() {
        LoginPage loginPage = openLoginPage();

        loginPage.enterUsername("nonexistent_user")
                 .enterPassword("wrongpassword")
                 .clickSubmit();

        // Wait for error to appear
        wait.until(ExpectedConditions.visibilityOfElementLocated(
                org.openqa.selenium.By.cssSelector("[data-testid='login-error-msg']")));

        assertTrue(loginPage.isErrorDisplayed(),
                "Error message should be visible after failed login");
        String error = loginPage.getErrorMessage();
        assertNotNull(error, "Error message text should not be null");
        assertFalse(error.isBlank(), "Error message should not be empty");
    }

    @Test
    @DisplayName("Submitting empty form shows validation error")
    void emptyFormSubmit_showsValidationError() {
        LoginPage loginPage = openLoginPage();

        // Click submit without filling any fields
        loginPage.clickSubmit();

        assertTrue(loginPage.isErrorDisplayed(),
                "Client-side validation error should appear for empty submission");
    }

    @Test
    @DisplayName("Logout returns user to /login page")
    void logout_redirectsToLoginPage() {
        // First log in
        LoginPage loginPage = openLoginPage();
        DashboardPage dashboard = loginPage.loginAs("operator1", "password123");
        dashboard.waitForLoad();

        // Now log out via the sidebar
        SidebarComponent sidebar = dashboard.getSidebar();
        LoginPage loginAfterLogout = sidebar.clickLogout();

        // Wait for redirect to login
        wait.until(ExpectedConditions.urlContains("/login"));

        assertTrue(driver.getCurrentUrl().contains("/login"),
                "URL should be /login after logout");
        loginAfterLogout.waitForLoad(); // login form should be present
    }

    @Test
    @DisplayName("Authenticated user navigating to /login is redirected to /dashboard")
    void alreadyAuthenticated_redirectsAwayFromLogin() {
        // Log in first
        openLoginPage().loginAs("operator1", "password123").waitForLoad();

        // Now manually navigate to /login again
        navigate("/login");

        // React Router should redirect back to /dashboard
        wait.until(ExpectedConditions.urlContains("/dashboard"));
        assertTrue(driver.getCurrentUrl().contains("/dashboard"),
                "Authenticated user should be redirected away from /login");
    }

    @Test
    @DisplayName("Unauthenticated user accessing /dashboard is redirected to /login")
    void unauthenticated_redirectedToLogin() {
        // Navigate directly to a protected route without logging in
        navigate("/dashboard");

        wait.until(ExpectedConditions.urlContains("/login"));
        assertTrue(driver.getCurrentUrl().contains("/login"),
                "Unauthenticated access to /dashboard should redirect to /login");
    }

    @Test
    @DisplayName("Register link on login page navigates to /register")
    void registerLink_navigatesToRegisterPage() {
        LoginPage loginPage = openLoginPage();
        loginPage.clickRegisterLink();

        wait.until(ExpectedConditions.urlContains("/register"));
        assertTrue(driver.getCurrentUrl().contains("/register"),
                "Clicking 'Request Access' should navigate to /register");
    }
}
