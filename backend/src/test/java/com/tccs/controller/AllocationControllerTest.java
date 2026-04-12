package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.service.AllocationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Map;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AllocationController.class)
class AllocationControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AllocationService allocationService;

    @Test
    @WithMockUser(roles = "TransportManager")
    void trigger_ShouldReturnOk_WhenUserIsTransportManager() throws Exception {
        AllocationService.AllocationResult result = new AllocationService.AllocationResult(
                true, "Manual trigger", BigDecimal.valueOf(100), null, "Delhi", 5, null, false);
        
        when(allocationService.checkAndTriggerAllocation("Delhi")).thenReturn(result);

        mockMvc.perform(post("/api/allocation/trigger")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("destination", "Delhi"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.triggered").value(true))
                .andExpect(jsonPath("$.destination").value("Delhi"));
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void trigger_ShouldReturn403_WhenUserIsBranchOperator() throws Exception {
        mockMvc.perform(post("/api/allocation/trigger")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("destination", "Delhi"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TransportManager")
    void pendingVolumes_ShouldReturnOk() throws Exception {
        when(allocationService.getPendingVolumes()).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/allocation/pending-volumes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingVolumes").exists());
    }
}
