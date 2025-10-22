import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { validateAuth, validateRole, addSecurityHeaders, getClientIP, logSecurityEvent } from "@/lib/security"
import { rateLimit, rateLimitConfigs, getRateLimitHeaders } from "@/lib/rate-limit"
import { generateCertificateSchema } from "@/lib/validation"
import { handleAPIError, createErrorResponse, ErrorCodes, validateRequestSize } from "@/lib/error-handler"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import fs from "fs"
import path from "path"

export async function POST(request: NextRequest) {
  try {
    if (!validateRequestSize(request, 5 * 1024)) {
      // 5KB limit
      return createErrorResponse(ErrorCodes.BAD_REQUEST, { message: "Request too large" })
    }

    const clientIP = getClientIP(request)

    const rateLimitResult = rateLimit(`cert:${clientIP}`, rateLimitConfigs.certificate)
    if (!rateLimitResult.success) {
      logSecurityEvent("RATE_LIMIT_EXCEEDED", { endpoint: "/api/generate-certificate", ip: clientIP }, request)
      const response = createErrorResponse(ErrorCodes.RATE_LIMITED)
      const headers = getRateLimitHeaders(rateLimitResult, rateLimitConfigs.certificate)
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      return addSecurityHeaders(response)
    }

    const authResult = await validateAuth(request)
    if (!authResult) {
      logSecurityEvent("UNAUTHORIZED_ACCESS", { endpoint: "/api/generate-certificate", ip: clientIP }, request)
      return addSecurityHeaders(createErrorResponse(ErrorCodes.UNAUTHORIZED))
    }

    const { user, profile } = authResult

    if (!validateRole(profile, "organization_admin")) {
      logSecurityEvent(
        "FORBIDDEN_ACCESS",
        {
          endpoint: "/api/generate-certificate",
          userId: user.id,
          role: profile.role,
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.FORBIDDEN))
    }

    const body = await request.json()
    const { employeeId, programId } = generateCertificateSchema.parse(body)

    const supabase = await createClient()

    const { data: employee, error: employeeError } = await supabase
      .from("profiles")
      .select("full_name, email, organization_id")
      .eq("id", employeeId)
      .eq("organization_id", profile.organization_id) // Ensure employee belongs to same org
      .single()

    if (employeeError || !employee) {
      logSecurityEvent(
        "INVALID_EMPLOYEE_ACCESS",
        {
          userId: user.id,
          employeeId,
          organizationId: profile.organization_id,
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Employee not found" }))
    }

    const { data: program, error: programError } = await supabase
      .from("certification_programs")
      .select("name, description, organization_id, certificate_template, organizations(name)")
      .eq("id", programId)
      .eq("organization_id", profile.organization_id) // Ensure program belongs to same org
      .single()

    if (programError || !program) {
      logSecurityEvent(
        "INVALID_PROGRAM_ACCESS",
        {
          userId: user.id,
          programId,
          organizationId: profile.organization_id,
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(createErrorResponse(ErrorCodes.NOT_FOUND, { message: "Program not found" }))
    }

    // Strict eligibility: must have completed all required reports and passed CBT test
    const { data: progress } = await supabase
      .from("employee_progress")
      .select("status")
      .eq("employee_id", employeeId)
      .eq("program_id", programId)
      .single()

    if (!progress || progress.status !== "completed") {
      logSecurityEvent(
        "CERTIFICATE_GENERATION_DENIED",
        {
          userId: user.id,
          employeeId,
          programId,
          status: progress?.status || "not_enrolled",
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.BAD_REQUEST, {
          message: "Employee has not completed this program",
        }),
      )
    }

    // Check all required reports are submitted and approved
    const { data: requiredReports } = await supabase
      .from("employee_reports")
      .select("id, status")
      .eq("employee_id", employeeId)
      .eq("program_id", programId)
    const allReportsApproved = requiredReports && requiredReports.length > 0 && requiredReports.every((r: {status: string}) => r.status === "approved")
    if (!allReportsApproved) {
      logSecurityEvent(
        "CERTIFICATE_GENERATION_DENIED",
        {
          userId: user.id,
          employeeId,
          programId,
          reason: "Not all required reports approved",
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.BAD_REQUEST, {
          message: "All required reports must be submitted and approved.",
        }),
      )
    }

    // Check CBT test is passed
    const { data: testAttempts } = await supabase
      .from("test_attempts")
      .select("score, passed")
      .eq("employee_id", employeeId)
      .eq("program_id", programId)
      .order("completed_at", { ascending: false })
    const passedTest = testAttempts && testAttempts.some((t: {passed: boolean}) => t.passed === true)
    if (!passedTest) {
      logSecurityEvent(
        "CERTIFICATE_GENERATION_DENIED",
        {
          userId: user.id,
          employeeId,
          programId,
          reason: "CBT test not passed",
          ip: clientIP,
        },
        request,
      )
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.BAD_REQUEST, {
          message: "CBT test must be passed to generate certificate.",
        }),
      )
    }

    const { data: existingCert } = await supabase
      .from("certificates")
      .select("id")
      .eq("employee_id", employeeId)
      .eq("program_id", programId)
      .single()

    if (existingCert) {
      return addSecurityHeaders(
        createErrorResponse(ErrorCodes.BAD_REQUEST, {
          message: "Certificate already exists for this employee and program",
        }),
      )
    }

    // Generate certificate number and verification code with better randomness
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 9).toUpperCase()
    const certificateNumber = `CERT-${timestamp}-${random}`
    const verificationCode = Array.from(
      { length: 12 },
      () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"[Math.floor(Math.random() * 36)],
    ).join("")

    const { data: certificate, error: certError } = await supabase
      .from("certificates")
      .insert({
        employee_id: employeeId,
        program_id: programId,
        organization_id: profile.organization_id,
        certificate_number: certificateNumber,
        issued_date: new Date().toISOString().split("T")[0],
        verification_code: verificationCode,
        status: "active",
      })
      .select()
      .single()

    if (certError) {
      logSecurityEvent(
        "CERTIFICATE_CREATION_FAILED",
        {
          userId: user.id,
          employeeId,
          programId,
          error: certError.message,
          ip: clientIP,
        },
        request,
      )
      throw certError
    }

    // Update employee progress
    await supabase
      .from("employee_progress")
      .update({
        completion_date: new Date().toISOString().split("T")[0],
        progress_percentage: 100,
      })
      .eq("employee_id", employeeId)
      .eq("program_id", programId)

    logSecurityEvent(
      "CERTIFICATE_GENERATED",
      {
        userId: user.id,
        organizationId: profile.organization_id,
        employeeId,
        programId,
        certificateNumber,
        ip: clientIP,
      },
      request,
    )

    // Type assertions for program data
    type ProgramWithOrg = {
      name: string;
      certificate_template: string;
      organizations: { name: string };
    };

    const programData = program as unknown as ProgramWithOrg;

    // Generate PDF Certificate
    const templatePath = path.join(process.cwd(), `public/certificates/${programData.certificate_template}.pdf`)
    const existingPdfBytes = fs.readFileSync(templatePath)
    const pdfDoc = await PDFDocument.load(existingPdfBytes)
    const pages = pdfDoc.getPages()
    const firstPage = pages[0]

    const { width, height } = firstPage.getSize()
    const font = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)

    // Draw certificate content
    firstPage.drawText(programData.organizations.name, {
      x: width / 2 - 100,
      y: height - 120,
      size: 20,
      font,
      color: rgb(0, 0, 0),
    })

    firstPage.drawText("Congratulations!", {
      x: width / 2 - 80,
      y: height - 180,
      size: 16,
      font,
    })

    firstPage.drawText(employee.full_name, {
      x: width / 2 - 100,
      y: height - 240,
      size: 24,
      font,
    })

    firstPage.drawText(`For completing: ${programData.name}`, {
      x: width / 2 - 200,
      y: height - 280,
      size: 14,
      font,
    })

    firstPage.drawText(`Issued on: ${certificate.issued_date}`, {
      x: width / 2 - 100,
      y: height - 320,
      size: 12,
      font,
    })

    firstPage.drawText(`Certificate ID: ${certificateNumber}`, {
      x: 50,
      y: 50,
      size: 12,
      font,
    })

    // Save PDF
    const pdfBytes = await pdfDoc.save()
    fs.writeFileSync(path.join(process.cwd(), `public/certificates/${certificateNumber}.pdf`), pdfBytes)

    const response = NextResponse.json({
      certificate: {
        id: certificate.id,
        certificateNumber,
        verificationCode,
        employeeName: employee.full_name,
        programName: program.name,
  organizationName: Array.isArray(program.organizations) ? (program.organizations[0] as any)?.name : (program.organizations as any)?.name,
        issuedDate: certificate.issued_date,
      },
    })

    const headers = getRateLimitHeaders(rateLimitResult, rateLimitConfigs.certificate)
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    // Set revalidation tags
    response.headers.set('x-revalidate-tag', `employee-${employeeId}`)
    response.headers.set('x-revalidate-tag', `program-${programId}`)
    response.headers.set('x-revalidate-tag', `organization-${profile.organization_id}`)

    return addSecurityHeaders(response)
  } catch (error) {
    logSecurityEvent(
      "API_ERROR",
      {
        endpoint: "/api/generate-certificate",
        error: error instanceof Error ? error.message : "Unknown error",
        ip: getClientIP(request),
      },
      request,
    )
    return addSecurityHeaders(handleAPIError(error))
  }
}
