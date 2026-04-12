package com.tccs.controller;

import com.tccs.repository.TruckRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ReportController.class)
class ReportControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EntityManager em;

    @MockBean
    private TruckRepository truckRepository;

    @Test
    @WithMockUser(roles = "TransportManager")
    void revenue_ShouldReturnOk() throws Exception {
        Query query = mock(Query.class);
        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        
        List<Object[]> summaryResult = new java.util.ArrayList<>();
        summaryResult.add(new Object[]{1000.0, 5L, 200.0, 50.0});

        // Mocking results for revenueByDest, daily, and summary
        when(query.getResultList()).thenReturn(
                new java.util.ArrayList<Object[]>(), // revenueByDest
                new java.util.ArrayList<Object[]>(), // daily
                summaryResult // summary
        );

        mockMvc.perform(get("/api/reports/revenue"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.summary.total_revenue").value(1000.0));
    }

    @Test
    @WithMockUser(roles = "TransportManager")
    void performance_ShouldReturnOk() throws Exception {
        Query query = mock(Query.class);
        when(em.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getResultList()).thenReturn(
                new java.util.ArrayList<Object[]>(),
                new java.util.ArrayList<Object[]>(),
                new java.util.ArrayList<Object[]>()
        );

        mockMvc.perform(get("/api/reports/performance"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void revenue_ShouldReturnForbiddenForBranchOperator() throws Exception {
        mockMvc.perform(get("/api/reports/revenue"))
                .andExpect(status().isForbidden());
    }
}
