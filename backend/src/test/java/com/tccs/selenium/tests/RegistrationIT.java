package com.tccs.selenium.tests;

import com.tccs.selenium.BaseSeleniumTest;
import com.tccs.selenium.pages.RegisterPage;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium tests for the self-registration flow ({@code /register}).
 *
 * <p>New registrations land in PENDING state and require admin approval —
 * these tests only verify the frontend behaviour up to the success screen.
 */
@DisplayName("Registration Tests")
class RegistrationIT extends BaseSeleniumTest {

    private RegisterPage openRegisterPage() {
        navigate("/register");
        return new RegisterPage(driver, wait).waitForLoad();
    }

    /** Generate a unique username so repeated test runs don't conflict. */
    private static String uniqueUsername() {
        return "testuser_" + UUID.randomUUID().toString().substring(0, 8);
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Valid registration form shows success confirmation")
    void validRegistration_showsSuccessHeading() {
        RegisterPage page = openRegisterPage();

        boolean success = page
                .enterName("Test Selenium User")
                .enterUsername(uniqueUsername())
                .enterPassword("SecurePass1!")
                .enterConfirmPassword("SecurePass1!")
                .selectRole("BranchOperator")
                .clickSubmit()
                .waitForSuccessHeading();

        assertTrue(success, "'Registration Submitted!' heading should appear on success");
    }

    @Test
    @DisplayName("Duplicate username shows backend error message")
    void duplicateUsername_showsError() {
        RegisterPage page = openRegisterPage();

        // operator1 already exists in the demo data
        page.enterName("Duplicate Test")
            .enterUsername("operator1")
            .enterPassword("SomePass99!")
            .enterConfirmPassword("SomePass99!")
            .selectRole("BranchOperator")
            .clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Backend should reject a duplicate username with an error");
        String error = page.getErrorMessage();
        assertNotNull(error);
        assertFalse(error.isBlank());
    }

    @Test
    @DisplayName("Mismatched passwords show client-side error")
    void mismatchedPasswords_showsError() {
        RegisterPage page = openRegisterPage();

        page.enterName("Mismatch Test")
            .enterUsername(uniqueUsername())
            .enterPassword("Pass1234!")
            .enterConfirmPassword("Different99!")
            .selectRole("BranchOperator")
            .clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Client-side validation should catch password mismatch");
    }

    @Test
    @DisplayName("Password shorter than 8 characters shows client-side error")
    void shortPassword_showsError() {
        RegisterPage page = openRegisterPage();

        page.enterName("Short Pass Test")
            .enterUsername(uniqueUsername())
            .enterPassword("short")
            .enterConfirmPassword("short")
            .selectRole("BranchOperator")
            .clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Client-side validation should reject passwords shorter than 8 characters");
    }

    @Test
    @DisplayName("Username shorter than 3 characters shows client-side error")
    void shortUsername_showsError() {
        RegisterPage page = openRegisterPage();

        page.enterName("Short Username Test")
            .enterUsername("ab")
            .enterPassword("ValidPass1!")
            .enterConfirmPassword("ValidPass1!")
            .selectRole("BranchOperator")
            .clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Client-side validation should reject usernames shorter than 3 characters");
    }

    @Test
    @DisplayName("Empty required fields show client-side error")
    void emptyRequiredFields_showsError() {
        RegisterPage page = openRegisterPage();

        // Submit without filling anything
        page.clickSubmit();

        assertTrue(page.isErrorDisplayed(),
                "Submitting an empty form should show a validation error");
    }

    @Test
    @DisplayName("Sign In link navigates to /login")
    void signInLink_navigatesToLogin() {
        RegisterPage page = openRegisterPage();
        page.clickSignInLink();

        org.openqa.selenium.support.ui.WebDriverWait w =
                new org.openqa.selenium.support.ui.WebDriverWait(driver, DEFAULT_WAIT);
        w.until(org.openqa.selenium.support.ui.ExpectedConditions.urlContains("/login"));

        assertTrue(driver.getCurrentUrl().contains("/login"),
                "'Sign In' link should navigate to /login");
    }
}
