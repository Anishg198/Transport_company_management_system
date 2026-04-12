# Beginner's Guide to JUnit 5 & Spring Testing in TCCS

Welcome! If you're new to Java testing, this guide explains how our test suite works, how JUnit 5 operates, and how it integrates with the Spring Boot framework.

---

## 1. What is JUnit 5?
JUnit 5 is the "engine" that runs our tests. Think of it as a specialized runner that looks for your code, executes it, and reports whether it behaved as expected.

### Key Building Blocks:
- **Annotations:** Special markers (starting with `@`) that tell JUnit how to treat a method.
  - `@Test`: Marks a method as a test case.
  - `@BeforeEach`: Runs a setup method *before every single test* (useful for resetting data).
- **Assertions:** These are "truth checks." We use **AssertJ** for this (e.g., `assertThat(result).isEqualTo(10)`). If an assertion fails, the test fails.

---

## 2. How JUnit Links to Spring Boot
Testing a Spring Boot app is different from testing a simple Java class because Spring manages your objects (Beans) and their dependencies.

### The `@WebMvcTest` Magic
In our project, we use `@WebMvcTest(TargetController.class)`. This is a specialized Spring test annotation that:
1.  **Starts a "Mini" Application:** It doesn't start the whole app (which is slow). It only starts the components needed for the Web Layer (Controllers, JSON converters, Security).
2.  **MockMvc:** It provides a `MockMvc` object. This acts like a "fake browser" that can send HTTP requests (GET, POST, etc.) directly to your controller without needing a real server.

### The `@MockBean` Connector
Because we are only testing the Controller, we don't want to use real Databases or Services. 
- When you use `@MockBean private ConsignmentService service;`, Spring creates a **Mock (Fake)** version of that service.
- You can "train" this fake service using Mockito: `when(service.getData()).thenReturn(someData);`.
- This keeps tests fast and isolated.

---

## 3. How Security is Handled
Since TCCS uses JWT and Roles, our tests must simulate logged-in users. We use **Spring Security Test**:

- **`@WithMockUser(roles = "SystemAdministrator")`**: This tells Spring, "For this specific test, act as if the user is already logged in with the Administrator role."
- **`.with(csrf())`**: Spring Security protects against CSRF attacks. This helper adds a "fake" security token to your POST/PUT requests so they aren't rejected.

---

## 4. Anatomy of a TCCS Test
Every test in our `src/test/java/com/tccs/controller` folder follows this **"Triple A"** pattern:

1.  **Arrange:** Set up the "fake" data and train the mocks.
    ```java
    // Arrange
    when(repository.findById(id)).thenReturn(Optional.of(mockData));
    ```
2.  **Act:** Perform the action (the HTTP request).
    ```java
    // Act
    mockMvc.perform(get("/api/data/123"))
    ```
3.  **Assert:** Verify the results.
    ```java
    // Assert
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.id").value(123));
    ```

---

## 5. How to Run the Tests
You don't need to do anything manual. Maven handles the lifecycle:

- **Compile & Run:** `mvn test`
- **Result:** JUnit will print a summary to your console. Green means success; Red means something is broken!

### Where are the files?
- **Code:** `src/main/java/...`
- **Tests:** `src/test/java/...` (Mirroring the package structure of the code)

---

## 6. Pro-Tip: The "Abstract" Base
We created `AbstractControllerTest.java`. Instead of repeating security setup in every file, all our tests "Extend" (inherit from) this class. It handles the heavy lifting of mocking the Security Filters so you can focus on writing actual tests!
