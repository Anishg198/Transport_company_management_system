package com.tccs.controller;

import com.tccs.model.Consignment;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.TruckRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DashboardController.class)
class DashboardControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ConsignmentRepository consignmentRepository;

    @MockBean
    private TruckRepository truckRepository;

    @Test
    @WithMockUser
    void summary_ShouldReturnOk() throws Exception {
        when(consignmentRepository.countTodaysConsignments(any())).thenReturn(5L);
        when(consignmentRepository.countByStatus(any())).thenReturn(10L);
        when(consignmentRepository.sumTodaysRevenue(any())).thenReturn(new BigDecimal("1000.00"));
        when(truckRepository.findAll()).thenReturn(Collections.emptyList());
        List<Object[]> pendingVols = new java.util.ArrayList<>();
        pendingVols.add(new Object[]{"Mumbai", new BigDecimal("50.0"), 5L});
        when(consignmentRepository.findPendingVolumesByDestination()).thenReturn(pendingVols);

        mockMvc.perform(get("/api/dashboard/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consignments.today_count").value(5))
                .andExpect(jsonPath("$.trucks.total").value(0))
                .andExpect(jsonPath("$.pendingVolumes").isArray());
    }

    @Test
    @WithMockUser
    void health_ShouldReturnOk() throws Exception {
        mockMvc.perform(get("/api/dashboard/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ok"));
    }
}
