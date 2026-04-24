"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type Resolver } from "react-hook-form";
import { useTranslations } from "next-intl";
import { z as zod } from "zod";
import { Form } from "@/components/form/Form";
import {
  DateInput,
  FileUpload,
  FormCheckbox,
  FormCombobox,
  FormattedInput,
  FormMultiSelect,
  FormOTPInput,
  FormSelect,
  FormSlider,
  FormSwitch,
  FormTextarea,
  TextInput,
} from "@/components/form";
import { formValidator } from "@/components/form/utils/form-validator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Iconify from "@/components/ui/iconify";
import { Typography } from "@/components/ui/typography";
import { toastSuccess } from "@/lib/toast";
import { inputFormatter } from "@/utils/formatters";
import {
  CATEGORY_OPTIONS,
  MULTI_OPTIONS,
  STATUS_OPTIONS,
  type DemoDateFileForm,
  type DemoFormattedForm,
  type DemoOtpForm,
  type DemoSelectForm,
  type DemoTextForm,
} from "@/components/demo/data";

const FORMATTED_SCHEMA = zod.object({
  formatUsd: formValidator.requiredString(),
  formatEur: formValidator.requiredString(),
  formatPercent: formValidator.requiredString(),
  formatPhone: formValidator.requiredString(),
  formatSsn: formValidator.requiredString(),
  formatCreditCard: formValidator.requiredString(),
  formatInteger: formValidator.requiredString(),
  formatBytes: formValidator.requiredString(),
});

const TEXT_SCHEMA = zod.object({
  name: formValidator.requiredString(),
  email: formValidator.requiredEmail(),
  notes: formValidator.requiredString(),
});

const SELECT_SCHEMA = zod.object({
  category: formValidator.requiredString(),
  status: formValidator.requiredString(),
  skills: formValidator.optionalStringArray(),
});

const OTP_SCHEMA = zod.object({
  otp: formValidator.requiredExactStringLength(6),
  volume: formValidator.numberInRange(0, 100),
  enableNotifications: formValidator.booleanField(),
  agree: formValidator.requiredBoolean(),
});

const DATE_FILE_SCHEMA = zod.object({
  date: formValidator.requiredDate(),
  dateRange: formValidator.optionalDateRange(),
  files: formValidator.multipleFiles({ minFiles: 1 }),
});

const FORMATTED_DEFAULTS: DemoFormattedForm = {
  formatUsd: "",
  formatEur: "",
  formatPercent: "",
  formatPhone: "",
  formatSsn: "",
  formatCreditCard: "",
  formatInteger: "",
  formatBytes: "",
};

export function DemoFormsTab() {
  const tDemo = useTranslations("demo");

  const formattedForm = useForm<DemoFormattedForm>({
    resolver: zodResolver(FORMATTED_SCHEMA),
    defaultValues: FORMATTED_DEFAULTS,
  });

  const textForm = useForm<DemoTextForm>({
    resolver: zodResolver(TEXT_SCHEMA),
    defaultValues: { name: "", email: "", notes: "" },
  });

  const selectForm = useForm<DemoSelectForm>({
    resolver: zodResolver(SELECT_SCHEMA),
    defaultValues: { category: "", status: "", skills: [] },
  });

  const otpForm = useForm<DemoOtpForm>({
    resolver: zodResolver(OTP_SCHEMA),
    defaultValues: {
      otp: "",
      volume: 50,
      enableNotifications: false,
      agree: false,
    },
  });

  const dateFileForm = useForm<DemoDateFileForm>({
    resolver: zodResolver(DATE_FILE_SCHEMA) as Resolver<DemoDateFileForm>,
    defaultValues: {
      date: undefined,
      dateRange: undefined,
      files: [],
    },
  });

  const toastSubmitted = () => {
    toastSuccess(tDemo("forms.submitSuccessTitle"), tDemo("forms.submitSuccessDescription"));
  };

  const onSubmitFormatted = async (data: DemoFormattedForm) => {
    await new Promise((r) => setTimeout(r, 1500));
    console.log("formatted", data);
    toastSubmitted();
  };

  const onSubmitText = (data: DemoTextForm) => {
    console.log("text", data);
    toastSubmitted();
  };

  const onSubmitSelect = (data: DemoSelectForm) => {
    console.log("select", data);
    toastSubmitted();
  };

  const onSubmitOtp = (data: DemoOtpForm) => {
    console.log("otp", data);
    toastSubmitted();
  };

  const onSubmitDateFile = (data: DemoDateFileForm) => {
    console.log("dateFile", data);
    toastSubmitted();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Form form={formattedForm} onSubmit={onSubmitFormatted} className="contents">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{tDemo("forms.allFormattedInputs")}</CardTitle>
              <CardDescription>
                <Typography variant="caption1" as="span" color="muted">
                  {tDemo("forms.formattedInputsHint")}
                </Typography>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormattedInput
                  name="formatUsd"
                  label="labels.formatUsd"
                  formatter={inputFormatter.dollar}
                  placeholder="placeholders.formatUsd"
                  required
                />
                <FormattedInput
                  name="formatEur"
                  label="labels.formatEur"
                  formatter={inputFormatter.euro}
                  placeholder="placeholders.formatEur"
                  required
                />
                <FormattedInput
                  name="formatPercent"
                  label="labels.formatPercent"
                  formatter={inputFormatter.percent}
                  placeholder="placeholders.formatPercent"
                  required
                />
                <FormattedInput
                  name="formatPhone"
                  label="labels.formatPhone"
                  formatter={inputFormatter.phone}
                  placeholder="placeholders.formatPhone"
                  required
                />
                <FormattedInput
                  name="formatSsn"
                  label="labels.formatSsn"
                  formatter={inputFormatter.ssn}
                  placeholder="placeholders.formatSsn"
                  required
                />
                <FormattedInput
                  name="formatCreditCard"
                  label="labels.formatCreditCard"
                  formatter={inputFormatter.creditCard}
                  placeholder="placeholders.formatCreditCard"
                  required
                />
                <FormattedInput
                  name="formatInteger"
                  label="labels.formatInteger"
                  formatter={inputFormatter.integer}
                  placeholder="placeholders.formatInteger"
                  required
                />
                <FormattedInput
                  name="formatBytes"
                  label="labels.formatBytes"
                  formatter={inputFormatter.bytes}
                  placeholder="placeholders.formatBytes"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                loading={formattedForm.formState.isSubmitting}
                loadingVariant="dots"
              >
                <Iconify icon="lucide:send" />
                {tDemo("forms.submitFormatted")}
              </Button>
            </CardContent>
          </Card>
        </Form>

        <Form form={textForm} onSubmit={onSubmitText} className="contents">
          <Card>
            <CardHeader>
              <CardTitle>{tDemo("forms.textInputs")}</CardTitle>
              <CardDescription>
                <Typography variant="caption1" as="span" color="muted">
                  {tDemo("forms.textInputsHint")}
                </Typography>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TextInput name="name" label="labels.name" placeholder="placeholders.name" required />
              <TextInput
                name="email"
                type="email"
                label="labels.email"
                placeholder="placeholders.email"
                required
              />
              <FormTextarea
                name="notes"
                label="labels.notes"
                placeholder="placeholders.notes"
                rows={3}
                maxLength={200}
                showCharCount
                required
              />
              <Button
                type="submit"
                size="lg"
                loading={textForm.formState.isSubmitting}
                loadingVariant="spinner"
              >
                <Iconify icon="lucide:send" />
                {tDemo("forms.submitText")}
              </Button>
            </CardContent>
          </Card>
        </Form>

        <Form form={selectForm} onSubmit={onSubmitSelect} className="contents">
          <Card>
            <CardHeader>
              <CardTitle>{tDemo("forms.selectAndMultiSelect")}</CardTitle>
              <CardDescription>
                <Typography variant="caption1" as="span" color="muted">
                  {tDemo("forms.selectSectionHint")}
                </Typography>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormSelect
                name="category"
                label="labels.category"
                placeholder="select"
                options={CATEGORY_OPTIONS}
              />
              <FormCombobox
                name="status"
                label="labels.status"
                placeholder="select"
                options={STATUS_OPTIONS}
              />
              <FormMultiSelect
                name="skills"
                label="labels.technologyStack"
                options={MULTI_OPTIONS}
                searchable
                searchPlaceholder="placeholders.search"
                maxDisplay={2}
              />
              <Button
                type="submit"
                size="lg"
                loading={selectForm.formState.isSubmitting}
                loadingVariant="ring"
              >
                <Iconify icon="lucide:send" />
                {tDemo("forms.submitSelect")}
              </Button>
            </CardContent>
          </Card>
        </Form>

        <Form form={otpForm} onSubmit={onSubmitOtp} className="contents">
          <Card>
            <CardHeader>
              <CardTitle>{tDemo("forms.otpSliderAndToggles")}</CardTitle>
              <CardDescription>
                <Typography variant="caption1" as="span" color="muted">
                  {tDemo("forms.otpSectionHint")}
                </Typography>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormOTPInput name="otp" label="labels.otp" length={6} required />
              <FormSlider name="volume" label="labels.volume" min={0} max={100} />
              <FormSwitch name="enableNotifications" label="labels.enableNotifications" />
              <FormCheckbox name="agree" label="labels.agree" />
              <Button
                type="submit"
                size="lg"
                loading={otpForm.formState.isSubmitting}
                loadingVariant="pulse"
              >
                <Iconify icon="lucide:send" />
                {tDemo("forms.submitOtp")}
              </Button>
            </CardContent>
          </Card>
        </Form>

        <Form form={dateFileForm} onSubmit={onSubmitDateFile} className="contents">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>{tDemo("forms.dateAndFileUpload")}</CardTitle>
              <CardDescription>
                <Typography variant="caption1" as="span" color="muted">
                  {tDemo("forms.dateFileSectionHint")}
                </Typography>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <DateInput name="date" label="labels.date" mode="single" required />
                <DateInput name="dateRange" label="labels.startDate" mode="range" />
              </div>
              <FileUpload
                name="files"
                label="labels.upload"
                multiple
                maxSize={5 * 1024 * 1024}
                required
              />
              <Button
                type="submit"
                size="lg"
                loading={dateFileForm.formState.isSubmitting}
                loadingVariant="spinner"
              >
                <Iconify icon="lucide:send" />
                {tDemo("forms.submitDateFiles")}
              </Button>
            </CardContent>
          </Card>
        </Form>
      </div>
    </div>
  );
}
