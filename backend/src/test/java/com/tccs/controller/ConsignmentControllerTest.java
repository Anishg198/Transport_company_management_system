package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Bill;
import com.tccs.model.Consignment;
import com.tccs.model.User;
import com.tccs.repository.BillRepository;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.repository.TruckRepository;
import com.tccs.service.AllocationService;
import com.tccs.service.BillService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ConsignmentController.class)
class ConsignmentControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ConsignmentRepository consignmentRepository;

    @MockBean
    private TruckRepository truckRepository;

    @MockBean
    private BillRepository billRepository;

    @MockBean
    private BillService billService;

    @MockBean
    private AllocationService allocationService;

    @Test
    @WithMockUser(roles = "BranchOperator")
    void getAll_ShouldReturnList() throws Exception {
        Consignment c = Consignment.builder()
                .consignmentNumber("TCCS-123")
                .status(Consignment.ConsignmentStatus.Registered)
                .destination("Mumbai")
                .registrationTimestamp(OffsetDateTime.now())
                .build();
        when(consignmentRepository.findAll()).thenReturn(List.of(c));

        mockMvc.perform(get("/api/consignments"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consignments").isArray())
                .andExpect(jsonPath("$.consignments[0].consignment_number").value("TCCS-123"));
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void create_ShouldReturnCreated() throws Exception {
        Map<String, Object> body = Map.of(
                "volume", 10.5,
                "destination", "Mumbai",
                "senderAddress", "Sender St",
                "receiverAddress", "Receiver St"
        );

        when(consignmentRepository.countTodaysConsignments(any())).thenReturn(0L);
        
        Bill bill = Bill.builder().billId(UUID.randomUUID()).consignmentNumber("TCCS-20260412-0001").transportCharges(new BigDecimal("100.00")).build();
        when(billService.generateBill(anyString(), any(), anyString(), any()))
                .thenReturn(new BillService.BillResult(bill, new BigDecimal("100.00"), Map.of()));
        
        when(allocationService.checkAndTriggerAllocation(anyString()))
                .thenReturn(new AllocationService.AllocationResult(false, "Threshold not met", BigDecimal.ZERO, null, "Mumbai", 0, null, false));

        when(consignmentRepository.findById(anyString())).thenAnswer(inv -> {
            String id = inv.getArgument(0);
            return Optional.of(Consignment.builder()
                    .consignmentNumber(id)
                    .volume(new BigDecimal("10.5"))
                    .destination("Mumbai")
                    .status(Consignment.ConsignmentStatus.Registered)
                    .build());
        });

        mockMvc.perform(post("/api/consignments")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.consignment.consignment_number").exists())
                .andExpect(jsonPath("$.allocationTriggered").value(false));

        verify(consignmentRepository, atLeastOnce()).save(any());
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void getById_ShouldReturnConsignment() throws Exception {
        String id = "TCCS-123";
        Consignment c = Consignment.builder()
                .consignmentNumber(id)
                .status(Consignment.ConsignmentStatus.Registered)
                .destination("Mumbai")
                .build();
        when(consignmentRepository.findById(id)).thenReturn(Optional.of(c));

        mockMvc.perform(get("/api/consignments/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consignment.consignment_number").value(id));
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void updateStatus_ShouldReturnUpdated() throws Exception {
        String id = "TCCS-123";
        Consignment c = Consignment.builder()
                .consignmentNumber(id)
                .status(Consignment.ConsignmentStatus.Registered)
                .build();
        when(consignmentRepository.findById(id)).thenReturn(Optional.of(c));

        Map<String, String> body = Map.of("status", "Pending", "note", "Test note");

        mockMvc.perform(patch("/api/consignments/" + id + "/status")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.consignment.status").value("Pending"));

        verify(consignmentRepository).save(any());
    }

    @Test
    @WithMockUser(roles = "BranchOperator")
    void delete_ShouldReturnForbiddenForBranchOperator() throws Exception {
        mockMvc.perform(delete("/api/consignments/TCCS-123").with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "SystemAdministrator")
    void delete_ShouldReturnOkForAdmin() throws Exception {
        String id = "TCCS-123";
        Consignment c = Consignment.builder()
                .consignmentNumber(id)
                .status(Consignment.ConsignmentStatus.Registered)
                .build();
        when(consignmentRepository.findById(id)).thenReturn(Optional.of(c));

        mockMvc.perform(delete("/api/consignments/" + id).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").exists());

        verify(consignmentRepository).delete(any());
    }
}
