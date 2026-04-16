package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.PricingRule;
import com.tccs.repository.PricingRuleRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(PricingController.class)
class PricingControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PricingRuleRepository pricingRuleRepository;

    @Test
    @WithMockUser
    void getAll_ShouldReturnRules() throws Exception {
        PricingRule rule = PricingRule.builder()
                .destination("Mumbai")
                .effectiveDate(LocalDate.now())
                .build();
        when(pricingRuleRepository.findAll()).thenReturn(new ArrayList<>(List.of(rule)));

        mockMvc.perform(get("/api/pricing-rules"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pricingRules").isArray());
    }

    @Test
    @WithMockUser(roles = "SystemAdministrator")
    void create_ShouldReturnCreated() throws Exception {
        Map<String, Object> body = Map.of(
                "destination", "Pune",
                "ratePerCubicMeter", 500,
                "minimumCharge", 1000,
                "effectiveDate", LocalDate.now().toString()
        );

        mockMvc.perform(post("/api/pricing-rules")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.pricingRule").exists());

        verify(pricingRuleRepository).save(any());
    }

    @Test
    @WithMockUser(roles = "SystemAdministrator")
    void update_ShouldReturnUpdated() throws Exception {
        UUID id = UUID.randomUUID();
        PricingRule rule = PricingRule.builder().id(id).destination("Mumbai").build();
        when(pricingRuleRepository.findById(id)).thenReturn(Optional.of(rule));

        mockMvc.perform(put("/api/pricing-rules/" + id)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("ratePerCubicMeter", 600))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pricingRule").exists());

        verify(pricingRuleRepository).save(any());
    }

    @Test
    @WithMockUser(roles = "TransportManager")
    void create_ShouldReturnForbiddenForManager() throws Exception {
        mockMvc.perform(post("/api/pricing-rules")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("test", "test"))))
                .andExpect(status().isForbidden());
    }
}
