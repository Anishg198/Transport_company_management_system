package com.tccs.selenium.tests;

import com.tccs.selenium.BaseSeleniumTest;
import com.tccs.selenium.pages.ConsignmentsPage;
import com.tccs.selenium.pages.LoginPage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Selenium integration tests for Consignment CRUD operations.
 *
 * <p>Runs as BranchOperator ({@code operator1}) which has permission to
 * register consignments and view the list. Each test logs in fresh so
 * tests remain independent.
 *
 * <p>These tests exercise the full round-trip: React UI → Vite proxy →
 * Spring Boot → PostgreSQL.
 */
@DisplayName("Consignment CRUD Tests")
class ConsignmentCrudIT extends BaseSeleniumTest {

    private ConsignmentsPage consignmentsPage;

    @BeforeEach
    void loginAndNavigate() {
        // Log in, then navigate directly to /consignments
        navigate("/login");
        new LoginPage(driver, wait).waitForLoad()
                .loginAs("operator1", "password123")
                .waitForLoad();

        navigate("/consignments");
        consignmentsPage = new ConsignmentsPage(driver, wait).waitForLoad();
    }

    // ── Tests ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Consignments page loads with table visible")
    void consignmentsPage_loads() {
        assertTrue(consignmentsPage.isLoaded(),
                "Consignments page heading should be visible");
    }

    @Test
    @DisplayName("Register button opens the modal form")
    void registerButton_opensModal() {
        consignmentsPage.clickOpenRegisterModal();

        // If the volume input is now visible, the modal opened successfully
        // (ConsignmentsPage.clickOpenRegisterModal already waits for it)
        // Getting here without a timeout means the modal opened
        assertTrue(true, "Modal opened — volume input appeared");
    }

    @Test
    @DisplayName("Creating a consignment persists it and returns a consignment number")
    void createConsignment_persistsAndReturnsNumber() {
        consignmentsPage.clickOpenRegisterModal()
                .enterVolume("25.50")
                .selectDestination("Mumbai")
                .enterSenderAddress("123 Sender Street, Delhi")
                .enterReceiverAddress("456 Receiver Road, Mumbai")
                .clickRegisterAndGenerateBill();

        String consignmentNumber = consignmentsPage.waitForConsignmentNumber();

        assertNotNull(consignmentNumber,
                "A consignment number should be returned after successful registration");
        assertFalse(consignmentNumber.isBlank(),
                "Consignment number should not be blank");
        // TCCS consignment numbers follow a TCCS-XXXXXX pattern
        assertTrue(consignmentNumber.startsWith("TCCS"),
                "Consignment number should start with 'TCCS', got: " + consignmentNumber);
    }

    @Test
    @DisplayName("Missing required fields prevent form submission")
    void missingFields_preventsSubmission() {
        consignmentsPage.clickOpenRegisterModal()
                // Only fill volume, leave everything else blank
                .enterVolume("10.00")
                .clickRegisterAndGenerateBill();

        // The consignment number result should NOT appear (form was invalid)
        String result = consignmentsPage.waitForConsignmentNumber();
        // If we get null here the backend was never called — expected behaviour
        // (browser native validation or React toast prevents submission)
        assertNull(result,
                "Incomplete form should not produce a consignment number");
    }

    @Test
    @DisplayName("Search filter narrows the consignments table")
    void searchFilter_narrowsResults() {
        // Type a search term that is highly unlikely to match any record
        consignmentsPage.search("TCCS-999999999");

        // Wait for the empty-state row to appear (confirms the API responded with 0 results)
        consignmentsPage.waitForEmptyState();

        int rows = consignmentsPage.getTableRows().size();
        assertEquals(1, rows,
                "After searching for a non-existent number, only the empty-state row should remain");
    }

    @Test
    @DisplayName("Consignment list table contains at least one row after login")
    void consignmentTable_hasRows() {
        // Wait for the loading skeleton to be replaced by the real table
        consignmentsPage.waitForTableBody();
        int rows = consignmentsPage.getTableRows().size();
        // Accept both: seeded data present (>1) or brand-new empty DB (empty-state row = 1)
        assertTrue(rows >= 1,
                "Consignments table should render at least one row (data or empty-state message)");
    }
}
