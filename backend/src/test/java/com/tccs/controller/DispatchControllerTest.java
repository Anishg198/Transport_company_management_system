package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.DispatchDocument;
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

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DispatchController.class)
class DispatchControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private DispatchDocumentRepository dispatchRepository;

    @MockBean
    private TruckRepository truckRepository;

    @MockBean
    private ConsignmentRepository consignmentRepository;

    @Test
    @WithMockUser
    void getAll_ShouldReturnList() throws Exception {
        DispatchDocument doc = DispatchDocument.builder()
                .dispatchId(UUID.randomUUID())
                .dispatchStatus(DispatchDocument.DispatchStatus.Dispatched)
                .destination("Mumbai")
                .build();
        when(dispatchRepository.findAllByOrderByDispatchTimestampDesc()).thenReturn(List.of(doc));

        mockMvc.perform(get("/api/dispatch"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dispatches").isArray());
    }

    @Test
    @WithMockUser
    void create_ShouldReturnBadRequestIfTruckNotAllocated() throws Exception {
        UUID truckId = UUID.randomUUID();
        Truck truck = Truck.builder().truckId(truckId).status(Truck.TruckStatus.Available).build();
        when(truckRepository.findById(truckId)).thenReturn(Optional.of(truck));

        mockMvc.perform(post("/api/dispatch")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("truckId", truckId.toString()))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").exists());
    }
}
