package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Truck;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.DispatchDocumentRepository;
import com.tccs.repository.TruckRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TruckController.class)
class TruckControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TruckRepository truckRepository;

    @MockBean
    private ConsignmentRepository consignmentRepository;

    @MockBean
    private DispatchDocumentRepository dispatchRepository;

    @Test
    @WithMockUser(roles = "TransportManager")
    void getAll_ShouldReturnList() throws Exception {
        Truck t = Truck.builder()
                .truckId(UUID.randomUUID())
                .registrationNumber("TRUCK-01")
                .status(Truck.TruckStatus.Available)
                .updatedAt(java.time.OffsetDateTime.now())
                .build();
        when(truckRepository.findAll()).thenReturn(new java.util.ArrayList<>(List.of(t)));

        mockMvc.perform(get("/api/trucks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.trucks").isArray());
    }

    @Test
    @WithMockUser(roles = "TransportManager")
    void create_ShouldReturnCreated() throws Exception {
        Map<String, Object> body = Map.of(
                "registrationNumber", "TRUCK-02",
                "capacity", 50.0,
                "driverName", "John Doe",
                "driverLicense", "LIC-123"
        );
        when(truckRepository.existsByRegistrationNumber("TRUCK-02")).thenReturn(false);

        mockMvc.perform(post("/api/trucks")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.truck").exists());

        verify(truckRepository).save(any());
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void create_ShouldReturnForbiddenForBranchOperator() throws Exception {
        mockMvc.perform(post("/api/trucks")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("test", "test"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "TransportManager")
    void updateStatus_ShouldReturnUpdated() throws Exception {
        UUID id = UUID.randomUUID();
        Truck t = Truck.builder()
                .truckId(id)
                .status(Truck.TruckStatus.Available)
                .build();
        when(truckRepository.findById(id)).thenReturn(Optional.of(t));

        Map<String, String> body = Map.of("status", "UnderMaintenance", "note", "Brake check");

        mockMvc.perform(patch("/api/trucks/" + id + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.truck.status").value("UnderMaintenance"));

        verify(truckRepository).save(any());
    }
}
