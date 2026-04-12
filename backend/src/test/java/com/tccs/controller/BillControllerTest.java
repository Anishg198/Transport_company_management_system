package com.tccs.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tccs.model.Bill;
import com.tccs.model.Consignment;
import com.tccs.repository.BillRepository;
import com.tccs.repository.ConsignmentRepository;
import com.tccs.service.BillService;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(BillController.class)
class BillControllerTest extends AbstractControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BillRepository billRepository;

    @MockBean
    private ConsignmentRepository consignmentRepository;

    @MockBean
    private BillService billService;

    @Test
    @WithMockUser
    void getByConsignment_ShouldReturnBill() throws Exception {
        String id = "TCCS-123";
        Bill bill = Bill.builder().billId(UUID.randomUUID()).consignmentNumber(id).build();
        when(billRepository.findFirstByConsignmentNumberOrderByCreatedAtDesc(id)).thenReturn(Optional.of(bill));
        
        Consignment c = Consignment.builder().consignmentNumber(id).status(Consignment.ConsignmentStatus.Registered).build();
        when(consignmentRepository.findById(id)).thenReturn(Optional.of(c));

        mockMvc.perform(get("/api/bills/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.bill.consignment_number").value(id));
    }

    @Test
    @WithMockUser
    void generate_ShouldReturnCreated() throws Exception {
        String id = "TCCS-123";
        Consignment c = Consignment.builder().consignmentNumber(id).volume(new BigDecimal("10.0")).destination("Mumbai").build();
        when(consignmentRepository.findById(id)).thenReturn(Optional.of(c));

        Bill bill = Bill.builder().billId(UUID.randomUUID()).consignmentNumber(id).transportCharges(new BigDecimal("100.0")).build();
        when(billService.generateBill(anyString(), any(), anyString(), any()))
                .thenReturn(new BillService.BillResult(bill, new BigDecimal("100.0"), Map.of()));

        mockMvc.perform(post("/api/bills/generate")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("consignmentNumber", id))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.bill").exists());
    }
}
