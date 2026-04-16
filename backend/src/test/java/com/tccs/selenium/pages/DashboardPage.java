package com.tccs.selenium.pages;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

/**
 * Page Object for the Dashboard page ({@code /dashboard}).
 */
public class DashboardPage {

    private final WebDriver driver;
    private final WebDriverWait wait;

    // The dashboard renders a page title in the Header component
    private static final By PAGE_HEADING = By.xpath("//h1[normalize-space()='Dashboard']");
    // Sidebar is present on every authenticated page
    private static final By SIDEBAR      = By.cssSelector("aside");

    public DashboardPage(WebDriver driver, WebDriverWait wait) {
        this.driver = driver;
        this.wait = wait;
    }

    /** Wait until the Dashboard heading is visible — confirms authenticated redirect.
     *  Uses a 20-second timeout to accommodate API calls made on mount. */
    public DashboardPage waitForLoad() {
        new WebDriverWait(driver, Duration.ofSeconds(20))
                .until(ExpectedConditions.visibilityOfElementLocated(PAGE_HEADING));
        return this;
    }

    public boolean isLoaded() {
        try {
            return driver.findElement(PAGE_HEADING).isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    public String getCurrentUrl() {
        return driver.getCurrentUrl();
    }

    public SidebarComponent getSidebar() {
        wait.until(ExpectedConditions.visibilityOfElementLocated(SIDEBAR));
        return new SidebarComponent(driver, wait);
    }
}
