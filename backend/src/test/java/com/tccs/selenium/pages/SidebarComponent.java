package com.tccs.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

/**
 * Reusable Page Component for the authenticated sidebar.
 *
 * <p>The sidebar is present on every page inside the protected {@code Layout}
 * wrapper, so this component is shared across multiple page objects.
 */
public class SidebarComponent {

    private final WebDriver driver;
    private final WebDriverWait wait;

    private static final By LOGOUT_BTN          = By.cssSelector("[data-testid='sidebar-logout-btn']");
    private static final By NAV_DASHBOARD        = By.cssSelector("[data-testid='nav-dashboard']");
    private static final By NAV_CONSIGNMENTS     = By.cssSelector("[data-testid='nav-consignments']");
    private static final By NAV_FLEET            = By.cssSelector("[data-testid='nav-fleet']");
    private static final By NAV_DISPATCH         = By.cssSelector("[data-testid='nav-dispatch']");
    private static final By NAV_BILLS            = By.cssSelector("[data-testid='nav-bills']");
    private static final By NAV_REPORTS          = By.cssSelector("[data-testid='nav-reports']");
    private static final By NAV_PRICING          = By.cssSelector("[data-testid='nav-pricing']");
    private static final By NAV_USERS            = By.cssSelector("[data-testid='nav-users']");
    private static final By NAV_SETTINGS         = By.cssSelector("[data-testid='nav-settings']");

    public SidebarComponent(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    public LoginPage clickLogout() {
        WebElement btn = wait.until(ExpectedConditions.presenceOfElementLocated(LOGOUT_BTN));
        // Use JS click — React synthetic events can miss Selenium native clicks in headless mode
        ((JavascriptExecutor) driver).executeScript("arguments[0].click();", btn);
        return new LoginPage(driver, wait);
    }

    public ConsignmentsPage clickConsignments() {
        wait.until(ExpectedConditions.elementToBeClickable(NAV_CONSIGNMENTS)).click();
        return new ConsignmentsPage(driver, wait);
    }

    public DashboardPage clickDashboard() {
        wait.until(ExpectedConditions.elementToBeClickable(NAV_DASHBOARD)).click();
        return new DashboardPage(driver, wait);
    }

    /** Returns true if the nav link for the given testid is present in the DOM. */
    public boolean isNavItemVisible(String testId) {
        try {
            return driver.findElement(By.cssSelector("[data-testid='" + testId + "']")).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }
}
