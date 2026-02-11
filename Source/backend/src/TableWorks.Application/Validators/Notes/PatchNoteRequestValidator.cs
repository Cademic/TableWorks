using FluentValidation;
using TableWorks.Application.DTOs.Notes;

namespace TableWorks.Application.Validators.Notes;

public sealed class PatchNoteRequestValidator : AbstractValidator<PatchNoteRequest>
{
    public PatchNoteRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(500).WithMessage("Title must not exceed 500 characters.")
            .When(x => x.PatchTitle);

        RuleFor(x => x.Content)
            .MaximumLength(5000).WithMessage("Content must not exceed 5000 characters.")
            .When(x => x.Content is not null);

        RuleFor(x => x.Color)
            .MaximumLength(20).WithMessage("Color must not exceed 20 characters.")
            .When(x => x.Color is not null);
    }
}
